'use server'

import prisma from '@/lib/prisma'
import { categorySchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createCategory(data: { name: string; description?: string }) {
  const validation = categorySchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const name = data.name.trim()
  const existing = await prisma.category.findUnique({
    where: { name },
  })
  if (existing) {
    throw new Error(`Category "${name}" already exists`)
  }

  const category = await prisma.category.create({
    data: {
      name,
      description: data.description?.trim() || null,
    },
  })

  revalidatePath('/dashboard/categories')
  return category
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  const validation = categorySchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const name = data.name.trim()
  const existing = await prisma.category.findFirst({
    where: {
      name,
      NOT: { id },
    },
  })
  if (existing) {
    throw new Error(`Category "${name}" already exists`)
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name,
      description: data.description?.trim() || null,
    },
  })

  revalidatePath('/dashboard/categories')
  return category
}

export async function deleteCategory(id: string) {
  const productsCount = await prisma.product.count({
    where: { categoryId: id },
  })

  if (productsCount > 0) {
    throw new Error('Cannot delete category with associated products. Reassign products first.')
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath('/dashboard/categories')
}
