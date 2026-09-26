import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { requireManager } from '@/lib/auth'
import { serializeUser } from '@/lib/serialize'
import { staffSchema } from '@/lib/validators'

/** Inventory Managers provision accounts for staff; the user must change the temporary password. */
export const POST = route(async (req) => {
  const manager = await requireManager(req)
  const body = staffSchema.parse(await readJson(req))

  const wh = await prisma.warehouse.findUnique({ where: { id: body.warehouseId } })
  if (!wh) throw new ApiError(400, 'Selected warehouse does not exist')

  const temporaryPassword = body.temporaryPassword || `staff${randomInt(1000, 10000)}`
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      warehouseId: wh.id,
      passwordHash: await bcrypt.hash(temporaryPassword, 10),
      createdBy: `${manager.name} (Inventory Manager)`,
      mustChangePassword: true,
    },
  })

  return json({ user: serializeUser(user), temporaryPassword }, 201)
})
