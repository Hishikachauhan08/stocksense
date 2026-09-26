import prisma from '@/lib/prisma'
import { json, route } from '@/lib/http'

export const dynamic = 'force-dynamic'

/** Aggregate numbers shown on the public landing page (no login required, no item details). */
export const GET = route(async () => {
  const [stock, products, warehouses] = await Promise.all([
    prisma.stockQuant.aggregate({ _sum: { quantity: true } }),
    prisma.product.count(),
    prisma.warehouse.count(),
  ])
  return json({
    totalUnitsInStock: stock._sum.quantity ?? 0,
    totalProductsCount: products,
    warehousesCount: warehouses,
  })
})
