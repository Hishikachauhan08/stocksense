'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { receiptSchema } from '@/lib/validations'
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

export async function getReceipts(status?: string) {
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }

  return prisma.receipt.findMany({
    where,
    include: {
      destination: {
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

export async function getReceipt(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      destination: {
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

export async function createReceipt(data: {
  destinationId: string
  notes?: string
  items: { productId: string; quantity: number }[]
}) {
  const validation = receiptSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const userId = await getEffectiveUserId()
  const reference = generateReference('REC')

  // Creating a receipt must NOT change stock. Saved as draft.
  const receipt = await prisma.receipt.create({
    data: {
      reference,
      status: 'draft',
      destinationId: data.destinationId,
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

  safeRevalidate('/dashboard/receipts')
  safeRevalidate('/dashboard')
  return receipt
}

export async function validateReceipt(id: string) {
  const userId = await getEffectiveUserId()

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      destination: true,
    },
  })

  if (!receipt) {
    throw new Error('Receipt not found')
  }

  if (receipt.status !== 'draft') {
    throw new Error(`Cannot validate receipt in "${receipt.status}" status`)
  }

  if (!receipt.items || receipt.items.length === 0) {
    throw new Error('Receipt must contain at least one item to validate')
  }

  // ATOMIC TRANSACTION:
  // 1. For each item: upsert StockBalance at destination location (+ quantity)
  // 2. Create StockMove ledger entry for each item
  // 3. Update receipt status to 'validated'
  await prisma.$transaction(async (tx) => {
    for (const item of receipt.items) {
      // 1. Update or create stock balance at destination location
      await tx.stockBalance.upsert({
        where: {
          productId_locationId: {
            productId: item.productId,
            locationId: receipt.destinationId,
          },
        },
        create: {
          productId: item.productId,
          locationId: receipt.destinationId,
          quantity: item.quantity,
        },
        update: {
          quantity: {
            increment: item.quantity,
          },
        },
      })

      // 2. Add entry to Stock Ledger
      await tx.stockMove.create({
        data: {
          reference: receipt.reference,
          productId: item.productId,
          movementType: 'Receipt',
          destinationId: receipt.destinationId,
          quantity: item.quantity,
          userId,
        },
      })
    }

    // 3. Mark receipt as validated
    await tx.receipt.update({
      where: { id: receipt.id },
      data: {
        status: 'validated',
        validatedAt: new Date(),
      },
    })
  })

  safeRevalidate('/dashboard/receipts')
  safeRevalidate(`/dashboard/receipts/${id}`)
  safeRevalidate('/dashboard/products')
  safeRevalidate('/dashboard/stock-ledger')
  safeRevalidate('/dashboard')

  return { success: true }
}
