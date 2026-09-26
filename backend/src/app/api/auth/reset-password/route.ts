import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { signSessionToken, verifyToken } from '@/lib/auth'
import { serializeUser } from '@/lib/serialize'
import { resetSchema } from '@/lib/validators'

/** Step 3 of the OTP reset: set the new password and sign the user in. */
export const POST = route(async (req) => {
  const { resetToken, password } = resetSchema.parse(await readJson(req))

  const payload = await verifyToken(resetToken, 'reset')
  if (!payload?.sub) throw new ApiError(400, 'Reset session expired. Please verify a new code.')

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  // The account was modified after the token was issued (e.g. token already used)
  if (!user || (payload.iat && user.updatedAt.getTime() > payload.iat * 1000 + 1000)) {
    throw new ApiError(400, 'Reset session expired. Please verify a new code.')
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false },
  })
  return json({ token: await signSessionToken(updated), user: serializeUser(updated) })
})
