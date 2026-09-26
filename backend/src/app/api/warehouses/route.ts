import prisma from '@/lib/prisma'
import { json, readJson, route } from '@/lib/http'
import { requireManager } from '@/lib/auth'
import { serializeWarehouse } from '@/lib/serialize'
import { warehouseSchema } from '@/lib/validators'

export const POST = route(async (req) => {
  await requireManager(req)
  const body = warehouseSchema.parse(await readJson(req))

  const locations = body.locations?.length
    ? body.locations
    : [{ name: 'General Rack A', code: `${body.code}-RACK-A`, type: 'rack' as const, capacity: 500 }]

  const warehouse = await prisma.warehouse.create({
    data: {
      name: body.name,
      code: body.code,
      address: body.address,
      manager: body.manager,
      locations: { create: locations },
    },
    include: { locations: true },
  })
  return json({ warehouse: serializeWarehouse(warehouse) }, 201)
})
