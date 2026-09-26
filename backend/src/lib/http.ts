import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export const badRequest = (msg: string) => new ApiError(400, msg)
export const notFound = (what = 'Resource') => new ApiError(404, `${what} not found`)

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>

/** Wraps a route handler with uniform JSON error responses. */
export function route<C = { params: Record<string, string> }>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx)
    } catch (err) {
      if (err instanceof ApiError) {
        return json({ error: err.message }, err.status)
      }
      if (err instanceof ZodError) {
        const issue = err.issues[0]
        const field = issue.path.join('.')
        return json({ error: field ? `${field}: ${issue.message}` : issue.message }, 400)
      }
      // Prisma unique constraint violation
      if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2002') {
        const target = (err as { meta?: { target?: string[] | string } }).meta?.target
        return json({ error: `A record with this ${[target].flat().join(', ') || 'value'} already exists` }, 409)
      }
      console.error(err)
      return json({ error: 'Internal server error' }, 500)
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw badRequest('Request body must be valid JSON')
  }
}
