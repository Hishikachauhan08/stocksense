import prisma from '@/lib/prisma'
import { json, notFound, readJson, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { getLocation, nextReference, validateAdjustment } from '@/lib/stock'
import { adjustmentSchema } from '@/lib/validators'

/** Record a physical count for a product at a location. Pass `validate: true` to apply it immediately. */
export const POST = route(async (req) => {
  const user = await requireUser(req)
  const body = adjustmentSchema.parse(await readJson(req))

  const adjustment = await prisma.$transaction(async (tx) => {
    await getLocation(tx, body.locationId)
    const product = await tx.product.findUnique({ where: { id: body.productId } })
    if (!product) throw notFound('Product')

    const quant = await tx.stockQuant.findUnique({
      where: { productId_locationId: { productId: body.productId, locationId: body.locationId } },
    })

    return tx.adjustment.create({
      data: {
        reference: await nextReference(tx, 'adjustment'),
        locationId: body.locationId,
        productId: body.productId,
        recordedQty: quant?.quantity ?? 0,
        countedQty: body.countedQty,
        reason: body.reason,
        notes: body.notes,
      },
    })
  })

  if (body.validate) await validateAdjustment(adjustment.id, user)
  return json({ adjustment }, 201)
})
