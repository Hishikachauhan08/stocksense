import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { signSessionToken } from '@/lib/auth'
import { serializeUser } from '@/lib/serialize'
import { loginSchema } from '@/lib/validators'

export const POST = route(async (req) => {
  const { email, password } = loginSchema.parse(await readJson(req))

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password')
  }

  return json({ token: await signSessionToken(user), user: serializeUser(user) })
})
