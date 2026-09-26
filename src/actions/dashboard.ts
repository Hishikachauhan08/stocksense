'use server'

import prisma from '@/lib/prisma'

export async function getDashboardStats(filters?: {
  categoryId?: string
  warehouseId?: string
  locationId?: string
}) {
  // 1. Fetch products with their stock balances and reorder rules
  const productWhere: any = {}
  if (filters?.categoryId && filters.categoryId !== 'all') {
    productWhere.categoryId = filters.categoryId
  }

  const allProducts = await prisma.product.findMany({
    where: productWhere,
    include: {
      category: true,
      stockBalances: {
        where: filters?.locationId && filters.locationId !== 'all'
          ? { locationId: filters.locationId }
          : filters?.warehouseId && filters.warehouseId !== 'all'
          ? { location: { warehouseId: filters.warehouseId } }
          : undefined,
        include: {
          location: {
            include: {
              warehouse: true,
            },
          },
        },
      },
      reorderRule: true,
    },
  })

  // Calculate product stock statuses
  let inStockCount = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  const lowStockItems: any[] = []
  const outOfStockItems: any[] = []

  allProducts.forEach((p) => {
    const totalStock = p.stockBalances.reduce((sum, sb) => sum + sb.quantity, 0)
    const reorderLevel = p.reorderRule?.reorderLevel ?? p.reorderLevel ?? 0

    if (totalStock === 0) {
      outOfStockCount++
      outOfStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        currentStock: 0,
        reorderLevel,
      })
    } else if (reorderLevel > 0 && totalStock <= reorderLevel) {
      lowStockCount++
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        currentStock: totalStock,
        reorderLevel,
        reorderQty: p.reorderRule?.reorderQty ?? (reorderLevel * 2),
      })
    } else {
      inStockCount++
    }
  })

  // 2. Pending operational documents
  const pendingReceipts = await prisma.receipt.count({
    where: {
      status: 'draft',
      ...(filters?.locationId && filters.locationId !== 'all' ? { destinationId: filters.locationId } : {}),
      ...(filters?.warehouseId && filters.warehouseId !== 'all' ? { destination: { warehouseId: filters.warehouseId } } : {}),
    },
  })

  const pendingDeliveries = await prisma.delivery.count({
    where: {
      status: 'draft',
      ...(filters?.locationId && filters.locationId !== 'all' ? { sourceId: filters.locationId } : {}),
      ...(filters?.warehouseId && filters.warehouseId !== 'all' ? { source: { warehouseId: filters.warehouseId } } : {}),
    },
  })

  const pendingTransfers = await prisma.transfer.count({
    where: {
      status: 'draft',
      ...(filters?.locationId && filters.locationId !== 'all'
        ? { OR: [{ sourceId: filters.locationId }, { destinationId: filters.locationId }] }
        : {}),
      ...(filters?.warehouseId && filters.warehouseId !== 'all'
        ? { OR: [{ source: { warehouseId: filters.warehouseId } }, { destination: { warehouseId: filters.warehouseId } }] }
        : {}),
    },
  })

  // 3. Recent 10 stock ledger moves
  const recentMoves = await prisma.stockMove.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      source: {
        include: {
          warehouse: true,
        },
      },
      destination: {
        include: {
          warehouse: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  return {
    totalProducts: allProducts.length,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    pendingReceipts,
    pendingDeliveries,
    pendingTransfers,
    lowStockItems,
    outOfStockItems,
    recentMoves,
  }
}
