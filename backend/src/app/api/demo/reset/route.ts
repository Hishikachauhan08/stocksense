import prisma from '@/lib/prisma'
import { json, route } from '@/lib/http'
import { requireManager } from '@/lib/auth'
import { seedInventory } from '@/lib/demo-data'

/** Restores the demo inventory dataset. User accounts are kept. */
export const POST = route(async (req) => {
  await requireManager(req)
  await seedInventory(prisma)
  return json({ ok: true })
})
