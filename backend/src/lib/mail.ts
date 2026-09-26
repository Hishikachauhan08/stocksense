import nodemailer from 'nodemailer'

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER)

/**
 * Sends the password-reset OTP. Returns true if an email was actually sent.
 * Without SMTP configured the code is logged to the server console instead.
 */
export async function sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
  if (!smtpConfigured) {
    console.log(`[OTP] Password reset code for ${to}: ${otp} (valid 10 minutes)`)
    return false
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Your StockSense password reset code',
    text: `Hi ${name},\n\nYour StockSense verification code is ${otp}. It expires in 10 minutes.\n\nIf you did not request a password reset, you can ignore this email.`,
  })
  return true
}
