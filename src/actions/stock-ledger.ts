'use server'

import prisma from '@/lib/prisma'

export async function getStockMoves(filters?: {
  search?: string
  movementType?: string
  productId?: string
  locationId?: string
  startDate?: string
  endDate?: string
}) {
  const where: any = {}

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim()
    where.OR = [
      { reference: { contains: s } },
      { product: { name: { contains: s } } },
      { product: { sku: { contains: s } } },
    ]
  }

  if (filters?.movementType && filters.movementType !== 'all') {
    where.movementType = filters.movementType
  }

  if (filters?.productId && filters.productId !== 'all') {
    where.productId = filters.productId
  }

  if (filters?.locationId && filters.locationId !== 'all') {
    where.OR = [
      ...(where.OR || []),
      { sourceId: filters.locationId },
      { destinationId: filters.locationId },
    ]
  }

  if (filters?.startDate) {
    where.date = { ...(where.date || {}), gte: new Date(filters.startDate) }
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate)
    end.setHours(23, 59, 59, 999)
    where.date = { ...(where.date || {}), lte: end }
  }

  return prisma.stockMove.findMany({
    where,
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
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 500,
  })
}
