import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { signResetToken } from '@/lib/auth'
import { verifyOtpSchema } from '@/lib/validators'

const MAX_ATTEMPTS = 5

/** Step 2 of the OTP reset: exchange a valid code for a short-lived reset token. */
export const POST = route(async (req) => {
  const { email, otp } = verifyOtpSchema.parse(await readJson(req))

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.otpHash || !user.otpExpiresAt) {
    throw new ApiError(400, 'No active code for this email. Request a new one.')
  }
  if (user.otpExpiresAt < new Date()) throw new ApiError(400, 'This code has expired. Request a new one.')
  if (user.otpAttempts >= MAX_ATTEMPTS) {
    throw new ApiError(429, 'Too many incorrect attempts. Request a new code.')
  }

  if (!(await bcrypt.compare(otp, user.otpHash))) {
    const attempts = user.otpAttempts + 1
    await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: attempts } })
    const left = MAX_ATTEMPTS - attempts
    throw new ApiError(
      400,
      left > 0 ? `Incorrect code. ${left} attempt(s) left.` : 'Too many incorrect attempts. Request a new code.'
    )
  }

  // Codes are single-use
  await prisma.user.update({
    where: { id: user.id },
    data: { otpHash: null, otpExpiresAt: null, otpAttempts: 0 },
  })
  return json({ resetToken: await signResetToken(user.id) })
})
