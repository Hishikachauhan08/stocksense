// End-to-end API check of the inventory flow from the problem statement.
// Usage: start the API (npm run dev), then: npm run test:api
// Note: creates test records in the database. Run `npm run db:seed` afterwards to restore demo data.

const BASE = process.env.API_URL || 'http://localhost:4000'
let token = ''
let passed = 0

async function call(method, path, body, expectStatus) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (expectStatus ? res.status !== expectStatus : !res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(data)}`)
  }
  return data
}

function check(label, cond) {
  if (!cond) throw new Error(`FAILED: ${label}`)
  passed++
  console.log(`  ok  ${label}`)
}

const stockAt = (state, productId, locationId) =>
  state.products.find((p) => p.id === productId)?.locationStocks.find((l) => l.locationId === locationId)?.quantity ?? 0
const total = (state, productId) => state.products.find((p) => p.id === productId)?.totalStock ?? 0

async function main() {
  console.log(`Testing ${BASE}`)

  // --- Auth ---
  await call('GET', '/api/state', null, 401)
  check('protected routes require login', true)

  const email = `tester${Date.now()}@example.com`
  const signup = await call('POST', '/api/auth/signup', { name: 'Test Manager', email, password: 'secret123', role: 'inventory_manager' }, 201)
  check('sign up returns a session token', Boolean(signup.token))

  await call('POST', '/api/auth/login', { email, password: 'wrong-pass' }, 401)
  const login = await call('POST', '/api/auth/login', { email, password: 'secret123' })
  token = login.token
  check('login works with correct password only', Boolean(token))

  const forgot = await call('POST', '/api/auth/forgot-password', { email })
  check('forgot password issues an OTP', Boolean(forgot.devOtp || forgot.emailSent))
  if (forgot.devOtp) {
    await call('POST', '/api/auth/verify-otp', { email, otp: forgot.devOtp === '000000' ? '111111' : '000000' }, 400)
    const { resetToken } = await call('POST', '/api/auth/verify-otp', { email, otp: forgot.devOtp })
    const reset = await call('POST', '/api/auth/reset-password', { resetToken, password: 'newsecret123' })
    token = reset.token
    await call('POST', '/api/auth/login', { email, password: 'newsecret123' })
    check('OTP reset: wrong code rejected, right code resets password', true)
  }

  // --- Product with SKU ---
  const sku = `TST-${Date.now()}`
  const { product } = await call('POST', '/api/products', {
    name: 'Test Steel', sku, category: 'Metals & Steel', unitOfMeasure: 'kg', price: 10, cost: 5,
    reorderingRule: { minQuantity: 10, maxQuantity: 200, reorderQuantity: 50, autoReorderEnabled: false },
  }, 201)
  await call('POST', '/api/products', { name: 'Dup', sku, category: 'X', unitOfMeasure: 'kg' }, 409)
  check('product created; duplicate SKU rejected', Boolean(product.id))

  const A = 'loc-main-rack-a'
  const PROD = 'loc-prod-rack-1'

  // Step 1: receive 100 kg
  const { operation: rec } = await call('POST', '/api/receipts', {
    supplier: 'Vendor Co', destLocationId: A, scheduledDate: '2026-01-01', items: [{ productId: product.id, demandQty: 100 }],
  }, 201)
  let s = await call('GET', '/api/state')
  check('draft receipt does not change stock', total(s, product.id) === 0)
  await call('POST', `/api/receipts/${rec.id}/validate`)
  s = await call('GET', '/api/state')
  check('validated receipt: stock +100', stockAt(s, product.id, A) === 100)
  await call('POST', `/api/receipts/${rec.id}/validate`, null, 409)
  check('receipt cannot be validated twice', true)

  // Step 2: internal transfer 30 kg
  const { operation: trf } = await call('POST', '/api/transfers', {
    sourceLocationId: A, destLocationId: PROD, scheduledDate: '2026-01-01', items: [{ productId: product.id, demandQty: 30 }],
  }, 201)
  await call('POST', `/api/transfers/${trf.id}/validate`)
  s = await call('GET', '/api/state')
  check('transfer moves stock, total unchanged', stockAt(s, product.id, A) === 70 && stockAt(s, product.id, PROD) === 30 && total(s, product.id) === 100)

  // Step 3: deliver 20 (and reject over-delivery)
  const { operation: bad } = await call('POST', '/api/deliveries', {
    customer: 'Buyer', sourceLocationId: A, scheduledDate: '2026-01-01', items: [{ productId: product.id, demandQty: 500 }],
  }, 201)
  await call('POST', `/api/deliveries/${bad.id}/validate`, null, 409)
  s = await call('GET', '/api/state')
  check('over-delivery rejected, stock untouched', stockAt(s, product.id, A) === 70)

  const { operation: del } = await call('POST', '/api/deliveries', {
    customer: 'Buyer', sourceLocationId: A, scheduledDate: '2026-01-01', items: [{ productId: product.id, demandQty: 20 }],
  }, 201)
  await call('PATCH', `/api/deliveries/${del.id}`, { isPicked: true })
  const packed = await call('PATCH', `/api/deliveries/${del.id}`, { isPacked: true })
  check('pick + pack moves delivery to ready', packed.operation.status === 'ready')
  await call('POST', `/api/deliveries/${del.id}/validate`)
  s = await call('GET', '/api/state')
  check('validated delivery: stock -20', stockAt(s, product.id, A) === 50 && total(s, product.id) === 80)

  // Step 4: 3 kg damaged
  await call('POST', '/api/adjustments', { locationId: PROD, productId: product.id, countedQty: 27, reason: 'damaged', validate: true }, 201)
  s = await call('GET', '/api/state')
  check('adjustment sets counted qty: stock -3', stockAt(s, product.id, PROD) === 27 && total(s, product.id) === 77)

  // Ledger
  const moves = s.moveHistory.filter((m) => m.productId === product.id)
  const types = moves.map((m) => m.operationType).sort().join(',')
  check('every movement logged in the stock ledger', types === 'adjustment,delivery,internal,receipt')
  check('ledger quantities are +100, 30, -20, -3', moves.map((m) => m.quantity).sort((a, b) => a - b).join(',') === '-20,-3,30,100')

  // KPIs + filters
  const kpi = await call('GET', '/api/dashboard')
  check('dashboard KPIs available', typeof kpi.pendingReceiptsCount === 'number' && typeof kpi.lowStockItemsCount === 'number')
  const kpiWh = await call('GET', '/api/dashboard?warehouseId=wh-prod')
  check('dashboard filters by warehouse', kpiWh.totalUnitsInStock <= kpi.totalUnitsInStock)

  // Low stock + quick reorder
  await call('POST', `/api/products/${product.id}/reorder`, null, 201)
  s = await call('GET', '/api/state')
  check('reorder creates a waiting receipt', s.receipts.some((r) => r.status === 'waiting' && r.items.some((i) => i.productId === product.id)))
  await call('DELETE', `/api/products/${product.id}`, null, 409)
  check('products with history cannot be deleted', true)

  console.log(`\nAll ${passed} checks passed.`)
}

main().catch((e) => {
  console.error(`\n${e.message}`)
  process.exit(1)
})
