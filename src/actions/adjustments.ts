'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adjustmentSchema } from '@/lib/validations'
import { generateReference } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

async function safeGetSession() {
  try {
    return await getServerSession(authOptions)
  } catch {
    return null
  }
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Standalone / script context
  }
}

async function getEffectiveUserId(): Promise<string> {
  const session = await safeGetSession()
  if (session?.user?.id) {
    return session.user.id
  }
  const existingUser = await prisma.user.findFirst()
  if (existingUser) return existingUser.id

  const newUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@stocksense.com',
      password: 'placeholder-password-hash',
      role: 'admin',
    },
  })
  return newUser.id
}

export async function getAdjustments(status?: string) {
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }

  return prisma.adjustment.findMany({
    where,
    include: {
      location: {
        include: {
          warehouse: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdjustment(id: string) {
  return prisma.adjustment.findUnique({
    where: { id },
    include: {
      location: {
        include: {
          warehouse: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function createAdjustment(data: {
  locationId: string
  notes?: string
  items: { productId: string; physicalQty: number }[]
}) {
  const validation = adjustmentSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const userId = await getEffectiveUserId()
  const reference = generateReference('ADJ')

  // Calculate systemQty and difference for each item based on current stock
  const itemsWithDiff = await Promise.all(
    data.items.map(async (item) => {
      const balance = await prisma.stockBalance.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: data.locationId,
          },
        },
      })

      const systemQty = balance ? balance.quantity : 0
      const difference = item.physicalQty - systemQty

      return {
        productId: item.productId,
        systemQty,
        physicalQty: item.physicalQty,
        difference,
      }
    })
  )

  const adjustment = await prisma.adjustment.create({
    data: {
      reference,
      status: 'draft',
      locationId: data.locationId,
      notes: data.notes?.trim() || null,
      userId,
      items: {
        create: itemsWithDiff,
      },
    },
    include: {
      items: true,
    },
  })

  safeRevalidate('/dashboard/adjustments')
  safeRevalidate('/dashboard')
  return adjustment
}

export async function validateAdjustment(id: string) {
  const userId = await getEffectiveUserId()

  const adjustment = await prisma.adjustment.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      location: true,
    },
  })

  if (!adjustment) {
    throw new Error('Adjustment record not found')
  }

  if (adjustment.status !== 'draft') {
    throw new Error(`Cannot validate adjustment in "${adjustment.status}" status`)
  }

  if (!adjustment.items || adjustment.items.length === 0) {
    throw new Error('Adjustment must contain at least one item to validate')
  }

  // ATOMIC TRANSACTION:
  // 1. For each item: update StockBalance quantity to physicalQty
  // 2. Record movement in StockMove ledger with difference
  // 3. Mark adjustment as 'validated'
  await prisma.$transaction(async (tx) => {
    for (const item of adjustment.items) {
      // 1. Update or create stock balance with physicalQty
      await tx.stockBalance.upsert({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: adjustment.locationId,
          },
        },
        create: {
          productId: item.productId,
          locationId: adjustment.locationId,
          quantity: item.physicalQty,
        },
        update: {
          quantity: item.physicalQty,
        },
      })

      // 2. Record ledger movement if difference != 0
      if (item.difference !== 0) {
        await tx.stockMove.create({
          data: {
            reference: adjustment.reference,
            productId: item.productId,
            movementType: 'Inventory Adjustment',
            // If positive difference: gained stock into location
            // If negative difference: removed stock from location
            destinationId: item.difference > 0 ? adjustment.locationId : null,
            sourceId: item.difference < 0 ? adjustment.locationId : null,
            quantity: Math.abs(item.difference),
            userId,
          },
        })
      }
    }

    // 3. Mark adjustment as validated
    await tx.adjustment.update({
      where: { id: adjustment.id },
      data: {
        status: 'validated',
        validatedAt: new Date(),
      },
    })
  })

  safeRevalidate('/dashboard/adjustments')
  safeRevalidate(`/dashboard/adjustments/${id}`)
  safeRevalidate('/dashboard/products')
  safeRevalidate('/dashboard/stock-ledger')
  safeRevalidate('/dashboard')

  return { success: true }
}
