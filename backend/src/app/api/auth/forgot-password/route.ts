import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { ApiError, json, readJson, route } from '@/lib/http'
import { sendOtpEmail } from '@/lib/mail'
import { forgotSchema } from '@/lib/validators'

const OTP_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 30 * 1000

/** Step 1 of the OTP reset: issue a 6-digit code (stored hashed, valid 10 minutes). */
export const POST = route(async (req) => {
  const { email } = forgotSchema.parse(await readJson(req))
  const message = 'If an account exists for this email, a 6-digit verification code has been sent.'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return json({ message })

  if (user.otpExpiresAt) {
    const issuedAt = user.otpExpiresAt.getTime() - OTP_TTL_MS
    if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, 'Please wait 30 seconds before requesting another code')
    }
  }

  const otp = String(randomInt(100000, 1000000))
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash: await bcrypt.hash(otp, 10),
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      otpAttempts: 0,
    },
  })

  const emailSent = await sendOtpEmail(user.email, user.name, otp)
  // Without SMTP, hand the code back so the flow is testable locally
  const exposeOtp = !emailSent && process.env.EXPOSE_DEV_OTP !== 'false'

  return json({
    message,
    emailSent,
    expiresInSeconds: OTP_TTL_MS / 1000,
    ...(exposeOtp ? { devOtp: otp } : {}),
  })
})
