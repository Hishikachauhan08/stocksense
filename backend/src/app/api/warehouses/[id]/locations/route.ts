import prisma from '@/lib/prisma'
import { json, notFound, readJson, route } from '@/lib/http'
import { requireManager } from '@/lib/auth'
import { locationSchema } from '@/lib/validators'

type Ctx = { params: { id: string } }

export const POST = route<Ctx>(async (req, { params }) => {
  await requireManager(req)
  const body = locationSchema.parse(await readJson(req))

  const warehouse = await prisma.warehouse.findUnique({ where: { id: params.id } })
  if (!warehouse) throw notFound('Warehouse')

  const location = await prisma.location.create({ data: { ...body, warehouseId: warehouse.id } })
  return json({ location }, 201)
})
