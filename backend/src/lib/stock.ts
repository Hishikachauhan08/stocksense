import type { Prisma, User } from '@prisma/client'
import prisma from './prisma'
import { ApiError, badRequest, notFound } from './http'

type Tx = Prisma.TransactionClient
type RefKind = 'receipt' | 'delivery' | 'internal' | 'adjustment'

const PREFIX: Record<RefKind, string> = {
  receipt: 'REC',
  delivery: 'DEL',
  internal: 'TRF',
  adjustment: 'ADJ',
}

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged Goods Scrapped',
  physical_count: 'Physical Inventory Reconciliation',
  scrap: 'Manufacturing Scrap',
  loss_theft: 'Loss / Unaccounted Variance',
  expired: 'Expired Shelf Life',
  other: 'Stock Adjustment',
}

const round = (n: number) => Math.round(n * 1000) / 1000

/** Next sequential reference, e.g. REC-2026-004. */
export async function nextReference(tx: Tx, kind: RefKind) {
  const prefix = `${PREFIX[kind]}-${new Date().getFullYear()}-`
  const where = { reference: { startsWith: prefix } }
  const rows =
    kind === 'adjustment'
      ? await tx.adjustment.findMany({ where, select: { reference: true } })
      : await tx.operation.findMany({ where, select: { reference: true } })
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.reference.slice(prefix.length), 10) || 0), 0)
  return prefix + String(max + 1).padStart(3, '0')
}

export async function getLocation(tx: Tx, id: string) {
  const loc = await tx.location.findUnique({ where: { id }, include: { warehouse: true } })
  if (!loc) throw badRequest(`Location ${id} does not exist`)
  return { ...loc, label: `${loc.warehouse.name} - ${loc.name}` }
}

async function quantAt(tx: Tx, productId: string, locationId: string) {
  const q = await tx.stockQuant.findUnique({ where: { productId_locationId: { productId, locationId } } })
  return q?.quantity ?? 0
}

async function setQuant(tx: Tx, productId: string, locationId: string, quantity: number) {
  await tx.stockQuant.upsert({
    where: { productId_locationId: { productId, locationId } },
    create: { productId, locationId, quantity: round(quantity) },
    update: { quantity: round(quantity) },
  })
}

/** Adds `delta` to a location's stock; refuses to go below zero. */
async function changeQuant(
  tx: Tx,
  product: { id: string; name: string; unitOfMeasure: string },
  location: { id: string; label: string },
  delta: number
) {
  const current = await quantAt(tx, product.id, location.id)
  const next = round(current + delta)
  if (next < 0) {
    throw new ApiError(
      409,
      `Insufficient stock: ${product.name} has only ${current} ${product.unitOfMeasure} at ${location.label} (needs ${-delta})`
    )
  }
  await setQuant(tx, product.id, location.id, next)
}

/** Validates a receipt / delivery / internal transfer and posts it to the stock ledger. */
export async function validateOperation(id: string, type: 'receipt' | 'delivery' | 'internal', user: User) {
  const touched = await prisma.$transaction(async (tx) => {
    const op = await tx.operation.findUnique({ where: { id }, include: { lines: { include: { product: true } } } })
    if (!op || op.type !== type) throw notFound('Document')
    if (op.status === 'done') throw new ApiError(409, `${op.reference} is already validated`)
    if (op.status === 'canceled') throw new ApiError(409, `${op.reference} is canceled`)
    if (op.lines.length === 0) throw badRequest('Add at least one product line before validating')

    const src = op.sourceLocationId ? await getLocation(tx, op.sourceLocationId) : null
    const dest = op.destLocationId ? await getLocation(tx, op.destLocationId) : null
    if ((type === 'receipt' || type === 'internal') && !dest) throw badRequest('Destination location is required')
    if ((type === 'delivery' || type === 'internal') && !src) throw badRequest('Source location is required')

    for (const line of op.lines) {
      const qty = line.doneQty > 0 ? line.doneQty : line.demandQty
      if (qty <= 0) throw badRequest(`Quantity for ${line.product.name} must be greater than zero`)

      let fromLocation = ''
      let toLocation = ''
      let signedQty = qty
      if (type === 'receipt') {
        await changeQuant(tx, line.product, dest!, qty)
        fromLocation = `Vendor (${op.partner || 'Supplier'})`
        toLocation = dest!.label
      } else if (type === 'delivery') {
        await changeQuant(tx, line.product, src!, -qty)
        fromLocation = src!.label
        toLocation = `Customer (${op.partner || 'Customer'})`
        signedQty = -qty
      } else {
        await changeQuant(tx, line.product, src!, -qty)
        await changeQuant(tx, line.product, dest!, qty)
        fromLocation = src!.label
        toLocation = dest!.label
      }

      await tx.operationLine.update({ where: { id: line.id }, data: { doneQty: qty } })
      await tx.stockMove.create({
        data: {
          reference: op.reference,
          operationType: type,
          productId: line.productId,
          productName: line.product.name,
          sku: line.product.sku,
          fromLocation,
          toLocation,
          quantity: signedQty,
          unitOfMeasure: line.product.unitOfMeasure,
          performedBy: user.name,
          notes: op.notes || undefined,
        },
      })
    }

    await tx.operation.update({
      where: { id },
      data: {
        status: 'done',
        validatedAt: new Date(),
        validatedBy: user.name,
        ...(type === 'delivery' ? { isPicked: true, isPacked: true } : {}),
      },
    })
    return op.lines.map((l) => l.productId)
  })

  if (type !== 'receipt') await runAutoReorder(touched)
}

/** Applies a physical count: location stock becomes the counted quantity. */
export async function validateAdjustment(id: string, user: User) {
  const productId = await prisma.$transaction(async (tx) => {
    const adj = await tx.adjustment.findUnique({ where: { id }, include: { product: true } })
    if (!adj) throw notFound('Adjustment')
    if (adj.status === 'done') throw new ApiError(409, `${adj.reference} is already validated`)
    if (adj.status === 'canceled') throw new ApiError(409, `${adj.reference} is canceled`)

    const loc = await getLocation(tx, adj.locationId)
    // Use the live on-hand quantity at validation time, not the one captured at creation
    const recorded = await quantAt(tx, adj.productId, adj.locationId)
    const diff = round(adj.countedQty - recorded)
    await setQuant(tx, adj.productId, adj.locationId, adj.countedQty)

    await tx.adjustment.update({
      where: { id },
      data: { recordedQty: recorded, status: 'done', validatedAt: new Date(), validatedBy: user.name },
    })
    await tx.stockMove.create({
      data: {
        reference: adj.reference,
        operationType: 'adjustment',
        productId: adj.productId,
        productName: adj.product.name,
        sku: adj.product.sku,
        fromLocation: loc.label,
        toLocation: `Inventory Adjustment (${REASON_LABELS[adj.reason] || adj.reason})`,
        quantity: diff,
        unitOfMeasure: adj.product.unitOfMeasure,
        performedBy: user.name,
        notes:
          adj.notes ||
          `Stock adjusted from ${recorded} to ${adj.countedQty} (${diff >= 0 ? '+' : ''}${diff} ${adj.product.unitOfMeasure})`,
      },
    })
    return adj.productId
  })

  await runAutoReorder([productId])
}

/** Creates a replenishment receipt (status "waiting") for a product. */
export async function createReorderReceipt(productId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { stocks: { orderBy: { quantity: 'desc' } } },
    })
    if (!product) throw notFound('Product')

    // Restock where the product is usually kept, else the first location in the system
    const destLocationId =
      product.stocks[0]?.locationId ??
      (await tx.location.findFirst({ orderBy: { createdAt: 'asc' } }))?.id
    if (!destLocationId) throw badRequest('Create a warehouse location first')

    const qty = product.reorderQuantity || product.minQuantity * 2 || 1
    const scheduled = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)

    return tx.operation.create({
      data: {
        type: 'receipt',
        reference: await nextReference(tx, 'receipt'),
        status: 'waiting',
        partner: 'Default Preferred Supplier',
        destLocationId,
        scheduledDate: scheduled,
        notes:
          note ||
          `Reorder triggered by low stock threshold (<=${product.minQuantity} ${product.unitOfMeasure})`,
        lines: { create: [{ productId: product.id, demandQty: qty }] },
      },
    })
  })
}

/**
 * Reordering rules: when a product with auto-reorder enabled drops to or below its
 * minimum quantity and has no open receipt, a replenishment receipt is drafted.
 */
async function runAutoReorder(productIds: string[]) {
  for (const productId of Array.from(new Set(productIds))) {
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { stocks: true } })
    if (!product || !product.autoReorderEnabled) continue
    const total = product.stocks.reduce((s, q) => s + q.quantity, 0)
    if (total > product.minQuantity) continue

    const open = await prisma.operationLine.findFirst({
      where: { productId, operation: { type: 'receipt', status: { notIn: ['done', 'canceled'] } } },
    })
    if (open) continue

    await createReorderReceipt(
      productId,
      `Auto-reorder: stock ${total} fell to/below minimum ${product.minQuantity} ${product.unitOfMeasure}`
    )
  }
}
