import prisma from '@/lib/prisma'
import { badRequest, json, notFound, route } from '@/lib/http'
import { requireManager } from '@/lib/auth'

type Ctx = { params: { id: string } }

export const DELETE = route<Ctx>(async (req, { params }) => {
  const manager = await requireManager(req)
  if (params.id === manager.id) throw badRequest('You cannot delete your own account')

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) throw notFound('User')

  await prisma.user.delete({ where: { id: user.id } })
  return json({ ok: true })
})
