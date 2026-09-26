import { json, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { createReorderReceipt } from '@/lib/stock'

type Ctx = { params: { id: string } }

/** One-click reorder from a low-stock alert: drafts a receipt for the rule's reorder quantity. */
export const POST = route<Ctx>(async (req, { params }) => {
  await requireUser(req)
  const receipt = await createReorderReceipt(params.id)
  return json({ receipt }, 201)
})
