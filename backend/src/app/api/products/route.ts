import prisma from '@/lib/prisma'
import { json, readJson, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { getLocation } from '@/lib/stock'
import { productSchema } from '@/lib/validators'

/** Create a product, optionally with opening stock (logged in the ledger). */
export const POST = route(async (req) => {
  const user = await requireUser(req)
  const body = productSchema.parse(await readJson(req))
  const rule = body.reorderingRule

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category,
        unitOfMeasure: body.unitOfMeasure,
        price: body.price,
        cost: body.cost,
        description: body.description ?? '',
        image: body.image,
        minQuantity: rule?.minQuantity ?? 0,
        maxQuantity: rule?.maxQuantity ?? 0,
        reorderQuantity: rule?.reorderQuantity ?? 0,
        autoReorderEnabled: rule?.autoReorderEnabled ?? false,
      },
    })

    for (const initial of body.initialLocationStocks ?? []) {
      if (initial.quantity <= 0) continue
      const loc = await getLocation(tx, initial.locationId)
      await tx.stockQuant.upsert({
        where: { productId_locationId: { productId: created.id, locationId: loc.id } },
        create: { productId: created.id, locationId: loc.id, quantity: initial.quantity },
        update: { quantity: { increment: initial.quantity } },
      })
      await tx.stockMove.create({
        data: {
          reference: `INIT-${created.sku}`,
          operationType: 'receipt',
          productId: created.id,
          productName: created.name,
          sku: created.sku,
          fromLocation: 'Initial Stock / Opening Balance',
          toLocation: loc.label,
          quantity: initial.quantity,
          unitOfMeasure: created.unitOfMeasure,
          performedBy: user.name,
          notes: 'Opening balance recorded at product creation',
        },
      })
    }
    return created
  })

  return json({ product }, 201)
})
