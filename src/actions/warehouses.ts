'use server'

import prisma from '@/lib/prisma'
import { warehouseSchema, locationSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getWarehouses() {
  return prisma.warehouse.findMany({
    include: {
      locations: {
        include: {
          stockBalances: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getLocations() {
  return prisma.location.findMany({
    include: {
      warehouse: true,
      stockBalances: {
        include: {
          product: true,
        },
      },
    },
    orderBy: [{ warehouse: { name: 'asc' } }, { name: 'asc' }],
  })
}

export async function createWarehouse(data: { name: string; address?: string }) {
  const validation = warehouseSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const name = data.name.trim()
  const existing = await prisma.warehouse.findUnique({
    where: { name },
  })
  if (existing) {
    throw new Error(`Warehouse "${name}" already exists`)
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name,
      address: data.address?.trim() || null,
    },
  })

  // Create a default "General" location in this warehouse
  await prisma.location.create({
    data: {
      name: 'Stock',
      warehouseId: warehouse.id,
    },
  })

  revalidatePath('/dashboard/warehouses')
  return warehouse
}

export async function createLocation(data: { name: string; warehouseId: string }) {
  const validation = locationSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const name = data.name.trim()
  const existing = await prisma.location.findUnique({
    where: {
      name_warehouseId: {
        name,
        warehouseId: data.warehouseId,
      },
    },
  })
  if (existing) {
    throw new Error(`Location "${name}" already exists in this warehouse`)
  }

  const location = await prisma.location.create({
    data: {
      name,
      warehouseId: data.warehouseId,
    },
  })

  revalidatePath('/dashboard/warehouses')
  return location
}
