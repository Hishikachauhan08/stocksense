'use server'

import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { productSchema } from '@/lib/validations'
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

export async function getProducts(search?: string, categoryId?: string) {
  const where: any = {}

  if (search && search.trim()) {
    const s = search.trim()
    where.OR = [
      { name: { contains: s } },
      { sku: { contains: s } },
    ]
  }

  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      stockBalances: {
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
    orderBy: { createdAt: 'desc' },
  })

  return products.map((p) => {
    const totalStock = p.stockBalances.reduce((sum, sb) => sum + sb.quantity, 0)
    const reorderLevel = p.reorderRule?.reorderLevel ?? p.reorderLevel ?? 0
    let stockStatus = 'In Stock'
    if (totalStock === 0) {
      stockStatus = 'Out of Stock'
    } else if (reorderLevel > 0 && totalStock <= reorderLevel) {
      stockStatus = 'Low Stock'
    }

    return {
      ...p,
      totalStock,
      stockStatus,
    }
  })
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      stockBalances: {
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

  if (!product) return null

  const totalStock = product.stockBalances.reduce((sum, sb) => sum + sb.quantity, 0)
  const reorderLevel = product.reorderRule?.reorderLevel ?? product.reorderLevel ?? 0
  let stockStatus = 'In Stock'
  if (totalStock === 0) {
    stockStatus = 'Out of Stock'
  } else if (reorderLevel > 0 && totalStock <= reorderLevel) {
    stockStatus = 'Low Stock'
  }

  return {
    ...product,
    totalStock,
    stockStatus,
  }
}

export async function createProduct(data: {
  name: string
  sku: string
  categoryId: string
  unitOfMeasure: string
  description?: string
  reorderLevel?: number
}) {
  await safeGetSession()
  const validation = productSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const normalizedSku = data.sku.trim().toUpperCase()

  const existing = await prisma.product.findUnique({
    where: { sku: normalizedSku },
  })
  if (existing) {
    throw new Error(`A product with SKU "${normalizedSku}" already exists`)
  }

  const product = await prisma.product.create({
    data: {
      name: data.name.trim(),
      sku: normalizedSku,
      categoryId: data.categoryId,
      unitOfMeasure: data.unitOfMeasure.trim() || 'pcs',
      description: data.description?.trim() || null,
      reorderLevel: data.reorderLevel ?? 0,
    },
  })

  if (data.reorderLevel && data.reorderLevel > 0) {
    await prisma.reorderRule.create({
      data: {
        productId: product.id,
        reorderLevel: data.reorderLevel,
        reorderQty: data.reorderLevel * 2,
      },
    })
  }

  safeRevalidate('/dashboard/products')
  safeRevalidate('/dashboard')
  return product
}

export async function updateProduct(id: string, data: {
  name: string
  sku: string
  categoryId: string
  unitOfMeasure: string
  description?: string
  reorderLevel?: number
}) {
  await safeGetSession()
  const validation = productSchema.safeParse(data)
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message)
  }

  const normalizedSku = data.sku.trim().toUpperCase()

  const existing = await prisma.product.findFirst({
    where: {
      sku: normalizedSku,
      NOT: { id },
    },
  })
  if (existing) {
    throw new Error(`A product with SKU "${normalizedSku}" already exists`)
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name.trim(),
      sku: normalizedSku,
      categoryId: data.categoryId,
      unitOfMeasure: data.unitOfMeasure.trim() || 'pcs',
      description: data.description?.trim() || null,
      reorderLevel: data.reorderLevel ?? 0,
    },
  })

  if (data.reorderLevel !== undefined) {
    if (data.reorderLevel > 0) {
      await prisma.reorderRule.upsert({
        where: { productId: id },
        create: {
          productId: id,
          reorderLevel: data.reorderLevel,
          reorderQty: data.reorderLevel * 2,
        },
        update: {
          reorderLevel: data.reorderLevel,
        },
      })
    } else {
      await prisma.reorderRule.deleteMany({
        where: { productId: id },
      })
    }
  }

  safeRevalidate('/dashboard/products')
  safeRevalidate(`/dashboard/products/${id}`)
  safeRevalidate('/dashboard')
  return product
}
