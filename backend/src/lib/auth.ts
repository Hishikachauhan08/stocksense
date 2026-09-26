import { SignJWT, jwtVerify } from 'jose'
import type { User } from '@prisma/client'
import prisma from './prisma'
import { ApiError } from './http'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'stocksense-dev-secret-change-me'
)

const SESSION_TTL = '7d'
const RESET_TTL = '10m'

export async function signSessionToken(user: Pick<User, 'id' | 'role'>) {
  return new SignJWT({ role: user.role, purpose: 'session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secret)
}

/** Short-lived token proving the OTP was verified; allows exactly one password reset. */
export async function signResetToken(userId: string) {
  return new SignJWT({ purpose: 'reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(RESET_TTL)
    .sign(secret)
}

export async function verifyToken(token: string, purpose: 'session' | 'reset') {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.purpose !== purpose || !payload.sub) return null
    return payload
  } catch {
    return null
  }
}

/** Resolves the logged-in user from the `Authorization: Bearer <token>` header. */
export async function requireUser(req: Request): Promise<User> {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? await verifyToken(token, 'session') : null
  if (!payload) throw new ApiError(401, 'Please sign in to continue')

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new ApiError(401, 'Account no longer exists')
  return user
}

export async function requireManager(req: Request): Promise<User> {
  const user = await requireUser(req)
  if (user.role !== 'inventory_manager') {
    throw new ApiError(403, 'Only an Inventory Manager can perform this action')
  }
  return user
}
