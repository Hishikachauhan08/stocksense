import prisma from '@/lib/prisma'
import { json, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const OPEN = { notIn: ['done', 'canceled'] }

/**
 * Dashboard KPIs. Optional filters: ?warehouseId=...&category=...
 */
export const GET = route(async (req) => {
  await requireUser(req)
  const url = new URL(req.url)
  const warehouseId = url.searchParams.get('warehouseId') || undefined
  const category = url.searchParams.get('category') || undefined

  const products = await prisma.product.findMany({
    where: category ? { category } : undefined,
    include: { stocks: { include: { location: true } } },
  })

  let totalUnits = 0
  let valuation = 0
  let inStock = 0
  let lowStock = 0
  let outOfStock = 0
  for (const p of products) {
    const qty = p.stocks
      .filter((s) => !warehouseId || s.location.warehouseId === warehouseId)
      .reduce((sum, s) => sum + s.quantity, 0)
    totalUnits += qty
    valuation += qty * p.price
    if (qty <= 0) outOfStock++
    else {
      inStock++
      if (qty <= p.minQuantity) lowStock++
    }
  }

  const locationFilter = warehouseId ? { warehouseId } : undefined
  const locIds = locationFilter
    ? (await prisma.location.findMany({ where: locationFilter, select: { id: true } })).map((l) => l.id)
    : undefined

  const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
    prisma.operation.count({ where: { type: 'receipt', status: OPEN, ...(locIds ? { destLocationId: { in: locIds } } : {}) } }),
    prisma.operation.count({ where: { type: 'delivery', status: OPEN, ...(locIds ? { sourceLocationId: { in: locIds } } : {}) } }),
    prisma.operation.count({
      where: {
        type: 'internal',
        status: OPEN,
        ...(locIds ? { OR: [{ sourceLocationId: { in: locIds } }, { destLocationId: { in: locIds } }] } : {}),
      },
    }),
  ])

  return json({
    totalProductsCount: products.length,
    productsInStockCount: inStock,
    totalUnitsInStock: totalUnits,
    lowStockItemsCount: lowStock,
    outOfStockItemsCount: outOfStock,
    pendingReceiptsCount: pendingReceipts,
    pendingDeliveriesCount: pendingDeliveries,
    internalTransfersScheduledCount: scheduledTransfers,
    totalInventoryValuation: Math.round(valuation * 100) / 100,
  })
})
