import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, otp, password } = validation.data
    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or OTP code' },
        { status: 400 }
      )
    }

    if (!user.otpCode || !user.otpExpiry) {
      return NextResponse.json(
        { error: 'No pending reset request found for this email. Request a new OTP.' },
        { status: 400 }
      )
    }

    if (new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    if (user.otpCode.trim() !== otp.trim()) {
      return NextResponse.json(
        { error: 'Incorrect OTP code entered' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiry: null,
      },
    })

    return NextResponse.json(
      { message: 'Password has been reset successfully. You can now log in.' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
