'use server'

import prisma from '@/lib/prisma'
import { reorderRuleSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getReorderRules() {
  return prisma.reorderRule.findMany({
    include: {
      product: {
        include: {
          category: true,
          stockBalances: {
            include: {
              location: true,
            },
          },
        },
      },
    },
    orderBy: { product: { name: 'asc' } },
  })
}

export async function createReorderRule(data: {
  productId: string
  reorderLevel: number
  reorderQty: number
}) {
  const validation = reorderRuleSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const existing = await prisma.reorderRule.findUnique({
    where: { productId: data.productId },
  })
  if (existing) {
    throw new Error('A reorder rule already exists for this product. You can edit the existing rule.')
  }

  const rule = await prisma.reorderRule.create({
    data: {
      productId: data.productId,
      reorderLevel: data.reorderLevel,
      reorderQty: data.reorderQty,
    },
  })

  // Synchronize product reorderLevel
  await prisma.product.update({
    where: { id: data.productId },
    data: { reorderLevel: data.reorderLevel },
  })

  revalidatePath('/dashboard/reorder-rules')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard')
  return rule
}

export async function updateReorderRule(id: string, data: {
  reorderLevel: number
  reorderQty: number
}) {
  const rule = await prisma.reorderRule.update({
    where: { id },
    data: {
      reorderLevel: data.reorderLevel,
      reorderQty: data.reorderQty,
    },
  })

  await prisma.product.update({
    where: { id: rule.productId },
    data: { reorderLevel: data.reorderLevel },
  })

  revalidatePath('/dashboard/reorder-rules')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard')
  return rule
}

export async function deleteReorderRule(id: string) {
  const rule = await prisma.reorderRule.findUnique({ where: { id } })
  if (!rule) throw new Error('Rule not found')

  await prisma.reorderRule.delete({ where: { id } })

  await prisma.product.update({
    where: { id: rule.productId },
    data: { reorderLevel: 0 },
  })

  revalidatePath('/dashboard/reorder-rules')
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard')
}
