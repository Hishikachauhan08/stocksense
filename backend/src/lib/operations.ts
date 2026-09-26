import prisma from './prisma'
import { ApiError, json, notFound, readJson, route } from './http'
import { requireUser } from './auth'
import { getLocation, nextReference, validateOperation } from './stock'
import { deliverySchema, operationPatchSchema, receiptSchema, transferSchema } from './validators'

export type OpType = 'receipt' | 'delivery' | 'internal'

async function assertProductsExist(ids: string[]) {
  const unique = Array.from(new Set(ids))
  const count = await prisma.product.count({ where: { id: { in: unique } } })
  if (count !== unique.length) throw new ApiError(400, 'One or more selected products do not exist')
}

/** Creates a draft receipt, delivery order or internal transfer. Stock is not touched until validation. */
export async function createOperation(type: OpType, body: unknown) {
  let data: {
    partner?: string
    sourceLocationId?: string
    destLocationId?: string
    scheduledDate: string
    shippingAddress?: string
    notes?: string
    items: { productId: string; demandQty: number; doneQty?: number }[]
  }

  if (type === 'receipt') {
    const r = receiptSchema.parse(body)
    data = { partner: r.supplier, destLocationId: r.destLocationId, scheduledDate: r.scheduledDate, notes: r.notes, items: r.items }
  } else if (type === 'delivery') {
    const d = deliverySchema.parse(body)
    data = {
      partner: d.customer,
      sourceLocationId: d.sourceLocationId,
      scheduledDate: d.scheduledDate,
      shippingAddress: d.shippingAddress,
      notes: d.notes,
      items: d.items,
    }
  } else {
    const t = transferSchema.parse(body)
    data = {
      sourceLocationId: t.sourceLocationId,
      destLocationId: t.destLocationId,
      scheduledDate: t.scheduledDate,
      notes: t.purpose,
      items: t.items,
    }
  }

  await assertProductsExist(data.items.map((i) => i.productId))

  return prisma.$transaction(async (tx) => {
    if (data.sourceLocationId) await getLocation(tx, data.sourceLocationId)
    if (data.destLocationId) await getLocation(tx, data.destLocationId)
    return tx.operation.create({
      data: {
        type,
        reference: await nextReference(tx, type),
        status: 'draft',
        partner: data.partner ?? '',
        sourceLocationId: data.sourceLocationId,
        destLocationId: data.destLocationId,
        scheduledDate: data.scheduledDate,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        lines: {
          create: data.items.map((i) => ({ productId: i.productId, demandQty: i.demandQty, doneQty: i.doneQty ?? 0 })),
        },
      },
    })
  })
}

/** Status changes and the delivery pick / pack workflow (draft → waiting → ready). */
export async function patchOperation(type: OpType, id: string, body: unknown) {
  const patch = operationPatchSchema.parse(body)
  const op = await prisma.operation.findUnique({ where: { id } })
  if (!op || op.type !== type) throw notFound('Document')
  if (op.status === 'done') throw new ApiError(409, `${op.reference} is already validated and cannot be changed`)

  const data: { status?: string; isPicked?: boolean; isPacked?: boolean } = {}
  if (patch.status) data.status = patch.status

  if (type === 'delivery' && (patch.isPicked !== undefined || patch.isPacked !== undefined)) {
    const isPicked = patch.isPicked ?? op.isPicked
    // Packing requires picking first; un-picking also un-packs
    const isPacked = isPicked ? patch.isPacked ?? op.isPacked : false
    data.isPicked = isPicked
    data.isPacked = isPacked
    data.status = isPacked ? 'ready' : isPicked ? 'waiting' : 'draft'
  }

  return prisma.operation.update({ where: { id }, data })
}

type Ctx = { params: { id: string } }

/** Route handlers shared by /api/receipts, /api/deliveries and /api/transfers. */
export function operationRoutes(type: OpType) {
  return {
    create: route(async (req) => {
      await requireUser(req)
      const operation = await createOperation(type, await readJson(req))
      return json({ operation }, 201)
    }),
    patch: route<Ctx>(async (req, { params }) => {
      await requireUser(req)
      const operation = await patchOperation(type, params.id, await readJson(req))
      return json({ operation })
    }),
    validate: route<Ctx>(async (req, { params }) => {
      const user = await requireUser(req)
      await validateOperation(params.id, type, user)
      return json({ ok: true })
    }),
  }
}
