import type {
  Adjustment,
  Location,
  Operation,
  OperationLine,
  Product,
  StockMove,
  StockQuant,
  User,
  Warehouse,
} from '@prisma/client'
import prisma from './prisma'

// Shapes returned here match frontend/src/types/inventory.ts

type LocationIndex = Map<string, Location & { warehouse: Warehouse }>

const iso = (d?: Date | null) => (d ? d.toISOString() : undefined)
const opt = <T>(v: T | null) => (v === null ? undefined : v)

export function serializeUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    warehouseId: u.warehouseId ?? '',
    createdBy: opt(u.createdBy),
    mustChangePassword: u.mustChangePassword,
    createdAt: iso(u.createdAt),
  }
}

export function serializeWarehouse(w: Warehouse & { locations: Location[] }) {
  return {
    id: w.id,
    name: w.name,
    code: w.code,
    address: w.address,
    manager: w.manager,
    locations: w.locations.map((l) => ({
      id: l.id,
      name: l.name,
      warehouseId: l.warehouseId,
      code: l.code,
      type: l.type,
      capacity: l.capacity,
    })),
  }
}

export function serializeProduct(p: Product & { stocks: (StockQuant & { location: Location })[] }) {
  const locationStocks = p.stocks
    .filter((s) => s.quantity !== 0)
    .map((s) => ({ warehouseId: s.location.warehouseId, locationId: s.locationId, quantity: s.quantity }))
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitOfMeasure: p.unitOfMeasure,
    price: p.price,
    cost: p.cost,
    description: p.description,
    image: opt(p.image),
    totalStock: locationStocks.reduce((sum, s) => sum + s.quantity, 0),
    locationStocks,
    reorderingRule: {
      minQuantity: p.minQuantity,
      maxQuantity: p.maxQuantity,
      reorderQuantity: p.reorderQuantity,
      autoReorderEnabled: p.autoReorderEnabled,
    },
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  }
}

type OperationWithLines = Operation & { lines: (OperationLine & { product: Product })[] }

function serializeLines(op: OperationWithLines) {
  return op.lines.map((l) => ({
    productId: l.productId,
    productName: l.product.name,
    sku: l.product.sku,
    unitOfMeasure: l.product.unitOfMeasure,
    demandQty: l.demandQty,
    doneQty: l.doneQty,
    sourceLocationId: opt(op.sourceLocationId),
    destLocationId: opt(op.destLocationId),
  }))
}

function common(op: OperationWithLines) {
  return {
    id: op.id,
    referenceNumber: op.reference,
    scheduledDate: op.scheduledDate,
    status: op.status,
    items: serializeLines(op),
    createdAt: iso(op.createdAt),
    validatedAt: iso(op.validatedAt),
    validatedBy: opt(op.validatedBy),
  }
}

const whOf = (locs: LocationIndex, id?: string | null) => (id ? locs.get(id)?.warehouseId ?? '' : '')

export function serializeOperation(op: OperationWithLines, locs: LocationIndex) {
  if (op.type === 'receipt') {
    return {
      ...common(op),
      supplier: op.partner,
      warehouseId: whOf(locs, op.destLocationId),
      destLocationId: op.destLocationId ?? '',
      notes: opt(op.notes),
    }
  }
  if (op.type === 'delivery') {
    return {
      ...common(op),
      customer: op.partner,
      warehouseId: whOf(locs, op.sourceLocationId),
      sourceLocationId: op.sourceLocationId ?? '',
      isPicked: op.isPicked,
      isPacked: op.isPacked,
      shippingAddress: opt(op.shippingAddress),
      notes: opt(op.notes),
    }
  }
  return {
    ...common(op),
    sourceWarehouseId: whOf(locs, op.sourceLocationId),
    sourceLocationId: op.sourceLocationId ?? '',
    destWarehouseId: whOf(locs, op.destLocationId),
    destLocationId: op.destLocationId ?? '',
    purpose: opt(op.notes),
  }
}

export function serializeAdjustment(a: Adjustment & { product: Product }, locs: LocationIndex) {
  return {
    id: a.id,
    referenceNumber: a.reference,
    warehouseId: whOf(locs, a.locationId),
    locationId: a.locationId,
    productId: a.productId,
    productName: a.product.name,
    sku: a.product.sku,
    unitOfMeasure: a.product.unitOfMeasure,
    recordedQty: a.recordedQty,
    countedQty: a.countedQty,
    differenceQty: a.countedQty - a.recordedQty,
    reason: a.reason,
    notes: opt(a.notes),
    status: a.status,
    createdAt: iso(a.createdAt),
    validatedAt: iso(a.validatedAt),
    validatedBy: opt(a.validatedBy),
  }
}

export function serializeMove(m: StockMove) {
  return {
    id: m.id,
    timestamp: iso(m.timestamp),
    referenceNumber: m.reference,
    operationType: m.operationType,
    productId: m.productId,
    productName: m.productName,
    sku: m.sku,
    fromLocation: m.fromLocation,
    toLocation: m.toLocation,
    quantity: m.quantity,
    unitOfMeasure: m.unitOfMeasure,
    performedBy: m.performedBy,
    notes: opt(m.notes),
  }
}

/** Full inventory snapshot used by the frontend. */
export async function loadState() {
  const [warehouses, products, operations, adjustments, moves, users] = await Promise.all([
    prisma.warehouse.findMany({ include: { locations: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ include: { stocks: { include: { location: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.operation.findMany({ include: { lines: { include: { product: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.adjustment.findMany({ include: { product: true }, orderBy: { createdAt: 'desc' } }),
    prisma.stockMove.findMany({ orderBy: { timestamp: 'desc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
  ])

  const locs: LocationIndex = new Map()
  for (const w of warehouses) for (const l of w.locations) locs.set(l.id, { ...l, warehouse: w })

  return {
    warehouses: warehouses.map(serializeWarehouse),
    products: products.map(serializeProduct),
    receipts: operations.filter((o) => o.type === 'receipt').map((o) => serializeOperation(o, locs)),
    deliveries: operations.filter((o) => o.type === 'delivery').map((o) => serializeOperation(o, locs)),
    transfers: operations.filter((o) => o.type === 'internal').map((o) => serializeOperation(o, locs)),
    adjustments: adjustments.map((a) => serializeAdjustment(a, locs)),
    moveHistory: moves.map(serializeMove),
    users: users.map(serializeUser),
  }
}
