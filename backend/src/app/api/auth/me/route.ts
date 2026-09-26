import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { serializeUser } from '@/lib/serialize'
import { profileSchema } from '@/lib/validators'

export const dynamic = 'force-dynamic'

export const GET = route(async (req) => {
  const user = await requireUser(req)
  return json({ user: serializeUser(user) })
})

/** My Profile: update name, email, warehouse and (with the current password) the password. */
export const PATCH = route(async (req) => {
  const user = await requireUser(req)
  const body = profileSchema.parse(await readJson(req))

  const data: {
    name?: string
    email?: string
    warehouseId?: string
    passwordHash?: string
    mustChangePassword?: boolean
  } = {}
  if (body.name) data.name = body.name
  if (body.email && body.email !== user.email) data.email = body.email
  if (body.warehouseId) {
    const wh = await prisma.warehouse.findUnique({ where: { id: body.warehouseId } })
    if (!wh) throw new ApiError(400, 'Selected warehouse does not exist')
    data.warehouseId = wh.id
  }
  if (body.newPassword) {
    if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      throw new ApiError(400, 'Current password is incorrect')
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10)
    data.mustChangePassword = false
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data })
  return json({ user: serializeUser(updated) })
})
