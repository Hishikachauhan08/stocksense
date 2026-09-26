'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deliverySchema } from '@/lib/validations'
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

export async function getDeliveries(status?: string) {
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }

  return prisma.delivery.findMany({
    where,
    include: {
      source: {
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

export async function getDelivery(id: string) {
  return prisma.delivery.findUnique({
    where: { id },
    include: {
      source: {
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

export async function createDelivery(data: {
  sourceId: string
  notes?: string
  items: { productId: string; quantity: number }[]
}) {
  const validation = deliverySchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const userId = await getEffectiveUserId()
  const reference = generateReference('OUT')

  // Creating a delivery does NOT change stock. Saved as draft.
  const delivery = await prisma.delivery.create({
    data: {
      reference,
      status: 'draft',
      sourceId: data.sourceId,
      notes: data.notes?.trim() || null,
      userId,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  safeRevalidate('/dashboard/deliveries')
  safeRevalidate('/dashboard')
  return delivery
}

export async function validateDelivery(id: string) {
  const userId = await getEffectiveUserId()

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      source: true,
    },
  })

  if (!delivery) {
    throw new Error('Delivery order not found')
  }

  if (delivery.status !== 'draft') {
    throw new Error(`Cannot validate delivery order in "${delivery.status}" status`)
  }

  if (!delivery.items || delivery.items.length === 0) {
    throw new Error('Delivery order must contain at least one item to validate')
  }

  // ATOMIC TRANSACTION:
  // 1. Check stock availability for every item at source location.
  //    Reject if requested quantity exceeds available stock.
  // 2. Decrement stock balance at source location.
  // 3. Create StockMove ledger entry for each item.
  // 4. Mark delivery as 'validated'.
  await prisma.$transaction(async (tx) => {
    for (const item of delivery.items) {
      const balance = await tx.stockBalance.findUnique({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: delivery.sourceId,
          },
        },
      })

      const availableStock = balance ? balance.quantity : 0

      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${item.product.name}" (SKU: ${item.product.sku}) at source location "${delivery.source.name}". Available: ${availableStock}, Requested: ${item.quantity}`
        )
      }

      // Decrement stock balance
      await tx.stockBalance.update({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: delivery.sourceId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      })

      // Add entry to Stock Ledger
      await tx.stockMove.create({
        data: {
          reference: delivery.reference,
          productId: item.productId,
          movementType: 'Delivery',
          sourceId: delivery.sourceId,
          quantity: item.quantity,
          userId,
        },
      })
    }

    // Mark delivery as validated
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        status: 'validated',
        validatedAt: new Date(),
      },
    })
  })

  safeRevalidate('/dashboard/deliveries')
  safeRevalidate(`/dashboard/deliveries/${id}`)
  safeRevalidate('/dashboard/products')
  safeRevalidate('/dashboard/stock-ledger')
  safeRevalidate('/dashboard')

  return { success: true }
}
