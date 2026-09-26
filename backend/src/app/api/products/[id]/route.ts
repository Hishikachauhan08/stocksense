import prisma from '@/lib/prisma'
import { ApiError, json, notFound, readJson, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { productUpdateSchema } from '@/lib/validators'

type Ctx = { params: { id: string } }

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireUser(req)
  const { reorderingRule, ...fields } = productUpdateSchema.parse(await readJson(req))

  const existing = await prisma.product.findUnique({ where: { id: params.id } })
  if (!existing) throw notFound('Product')

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...fields,
      ...(reorderingRule
        ? {
            minQuantity: reorderingRule.minQuantity,
            maxQuantity: reorderingRule.maxQuantity,
            reorderQuantity: reorderingRule.reorderQuantity,
            autoReorderEnabled: reorderingRule.autoReorderEnabled,
          }
        : {}),
    },
  })
  return json({ product })
})

export const DELETE = route<Ctx>(async (req, { params }) => {
  await requireUser(req)
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { _count: { select: { lines: true, adjustments: true } } },
  })
  if (!product) throw notFound('Product')

  // Keep the audit trail intact: products used in documents cannot be removed
  if (product._count.lines > 0 || product._count.adjustments > 0) {
    throw new ApiError(409, `${product.name} is used in receipts, deliveries, transfers or adjustments and cannot be deleted`)
  }

  await prisma.product.delete({ where: { id: product.id } })
  return json({ ok: true })
})
