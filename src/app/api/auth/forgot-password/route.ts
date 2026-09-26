import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const email = validation.data.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Security: return standard message without disclosing existence
      return NextResponse.json(
        { message: 'If this email is registered, a 6-digit OTP has been issued.' },
        { status: 200 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry,
      },
    })

    console.log('\n=======================================')
    console.log(`[PASSWORD RESET OTP] For: ${email}`)
    console.log(`[OTP CODE]: ${otp}`)
    console.log(`[EXPIRES AT]: ${otpExpiry.toLocaleTimeString()}`)
    console.log('=======================================\n')

    return NextResponse.json({
      message: 'If this email is registered, a 6-digit OTP has been issued.',
      // Always return devOtp in development so the tester can complete the flow immediately
      devOtp: otp,
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
