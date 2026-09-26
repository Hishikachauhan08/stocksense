import { json, route } from '@/lib/http'
import { requireUser } from '@/lib/auth'
import { loadState } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** Full inventory snapshot: warehouses, products, operations, adjustments, ledger and users. */
export const GET = route(async (req) => {
  await requireUser(req)
  return json(await loadState())
})
