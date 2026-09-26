import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { signSessionToken } from '@/lib/auth'
import { serializeUser } from '@/lib/serialize'
import { signupSchema } from '@/lib/validators'

export const POST = route(async (req) => {
  const body = signupSchema.parse(await readJson(req))

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) throw new ApiError(409, 'An account with this email already exists')

  const warehouse = body.warehouseId
    ? await prisma.warehouse.findUnique({ where: { id: body.warehouseId } })
    : await prisma.warehouse.findFirst({ orderBy: { createdAt: 'asc' } })

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
      role: body.role,
      warehouseId: warehouse?.id,
      createdBy: 'Self sign-up',
    },
  })

  return json({ token: await signSessionToken(user), user: serializeUser(user) }, 201)
})
