import { json, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { validateAdjustment } from '@/lib/stock'

type Ctx = { params: { id: string } }

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser(req)
  await validateAdjustment(params.id, user)
  return json({ ok: true })
})
