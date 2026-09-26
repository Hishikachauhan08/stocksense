import { json } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  return json({ status: 'ok', service: 'stocksense-api', time: new Date().toISOString() })
}
