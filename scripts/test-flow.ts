import { PrismaClient } from '@prisma/client'
import { createProduct, getProduct } from '../src/actions/products'
import { createReceipt, validateReceipt } from '../src/actions/receipts'
import { createTransfer, validateTransfer } from '../src/actions/transfers'
import { createDelivery, validateDelivery } from '../src/actions/deliveries'
import { createAdjustment, validateAdjustment } from '../src/actions/adjustments'
import { getStockMoves } from '../src/actions/stock-ledger'
import { getDashboardStats } from '../src/actions/dashboard'

const prisma = new PrismaClient()

async function runVerification() {
  console.log('\n======================================================')
  console.log('🚀 StockSense End-to-End Stock Lifecycle Test Suite')
  console.log('======================================================\n')

  // Retrieve seed warehouse & locations
  const wh = await prisma.warehouse.findFirst({
    where: { name: { contains: 'Main' } },
    include: { locations: true },
  })
  const wh2 = await prisma.warehouse.findFirst({
    where: { name: { contains: 'North' } },
    include: { locations: true },
  })
  const category = await prisma.category.findFirst()

  if (!wh || !wh2 || !category) {
    throw new Error('Database not seeded! Please run prisma seed first.')
  }

  const locSource = wh.locations[0]
  const locDestination = wh2.locations[0]

  console.log(`Using Locations:\n- Source: [${wh.name} → ${locSource.name}]\n- Dest: [${wh2.name} → ${locDestination.name}]\n`)

  // STEP 1: CREATE PRODUCT
  console.log('--- Step 1: Create Product ---')
  const testSku = `TEST-E2E-${Date.now().toString().slice(-4)}`
  const product = await createProduct({
    name: 'E2E Testing Mechanical Sensor',
    sku: testSku,
    categoryId: category.id,
    unitOfMeasure: 'units',
    description: 'Automated lifecycle test product',
    reorderLevel: 20,
  })
  console.log(`✓ Product created: "${product.name}" (SKU: ${product.sku}, ID: ${product.id})`)

  let pInfo = await getProduct(product.id)
  console.log(`  Initial total stock: ${pInfo?.totalStock} (Status: ${pInfo?.stockStatus})`)
  if (pInfo?.totalStock !== 0) throw new Error('Initial stock must be 0')

  // STEP 2: RECEIVE STOCK (DRAFT THEN VALIDATE)
  console.log('\n--- Step 2: Receive Stock ---')
  const receipt = await createReceipt({
    destinationId: locSource.id,
    notes: 'E2E Test Purchase Order #PO-999',
    items: [{ productId: product.id, quantity: 100 }],
  })
  console.log(`✓ Draft receipt created: ${receipt.reference}`)

  // Verify stock unchanged on draft
  pInfo = await getProduct(product.id)
  console.log(`  Stock before validation (must be 0): ${pInfo?.totalStock}`)
  if (pInfo?.totalStock !== 0) throw new Error('Creating draft receipt altered stock!')

  // Validate receipt
  await validateReceipt(receipt.id)
  pInfo = await getProduct(product.id)
  console.log(`✓ Receipt validated. Stock after validation: ${pInfo?.totalStock}`)
  if (pInfo?.totalStock !== 100) throw new Error(`Expected 100 stock, got ${pInfo?.totalStock}`)

  const locBalance = await prisma.stockBalance.findUnique({
    where: {
      productId_locationId: {
        productId: product.id,
        locationId: locSource.id,
      },
    },
  })
  console.log(`  Verified location stock at ${locSource.name}: ${locBalance?.quantity}`)
  if (locBalance?.quantity !== 100) throw new Error('Stock balance at destination incorrect')

  // STEP 3: TRANSFER STOCK
  console.log('\n--- Step 3: Internal Transfer ---')
  const transfer = await createTransfer({
    sourceId: locSource.id,
    destinationId: locDestination.id,
    notes: 'E2E Relocation 30 units',
    items: [{ productId: product.id, quantity: 30 }],
  })
  console.log(`✓ Draft transfer created: ${transfer.reference}`)

  await validateTransfer(transfer.id)
  console.log('✓ Transfer validated.')

  const sourceBalAfterTransfer = await prisma.stockBalance.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locSource.id } },
  })
  const destBalAfterTransfer = await prisma.stockBalance.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locDestination.id } },
  })

  console.log(`  Source location stock decreased to: ${sourceBalAfterTransfer?.quantity} (expected 70)`)
  console.log(`  Destination location stock increased to: ${destBalAfterTransfer?.quantity} (expected 30)`)
  if (sourceBalAfterTransfer?.quantity !== 70 || destBalAfterTransfer?.quantity !== 30) {
    throw new Error('Transfer quantities incorrect!')
  }

  pInfo = await getProduct(product.id)
  console.log(`  Total company stock remains unchanged: ${pInfo?.totalStock} (expected 100)`)
  if (pInfo?.totalStock !== 100) throw new Error('Total company stock changed during internal transfer!')

  // STEP 4: OVER-DELIVERY PREVENT CHECK & VALID DELIVERY
  console.log('\n--- Step 4: Deliveries & Over-Delivery Prevention ---')
  const overDelivery = await createDelivery({
    sourceId: locSource.id,
    notes: 'E2E Attempting to over-deliver 999 units',
    items: [{ productId: product.id, quantity: 999 }],
  })

  let overDeliveryBlocked = false
  try {
    await validateDelivery(overDelivery.id)
  } catch (err: any) {
    overDeliveryBlocked = true
    console.log(`✓ Over-delivery properly rejected with error: "${err.message}"`)
  }
  if (!overDeliveryBlocked) throw new Error('Over-delivery was NOT prevented!')

  // Valid delivery of 25 units
  const validDelivery = await createDelivery({
    sourceId: locSource.id,
    notes: 'E2E Valid Dispatch 25 units',
    items: [{ productId: product.id, quantity: 25 }],
  })
  await validateDelivery(validDelivery.id)

  const sourceBalAfterDelivery = await prisma.stockBalance.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locSource.id } },
  })
  console.log(`✓ Valid delivery dispatched. Source location stock decreased to: ${sourceBalAfterDelivery?.quantity} (expected 45)`)
  if (sourceBalAfterDelivery?.quantity !== 45) throw new Error('Delivery failed to deduct stock correctly')

  pInfo = await getProduct(product.id)
  console.log(`  Total company stock decreased to: ${pInfo?.totalStock} (expected 75)`)
  if (pInfo?.totalStock !== 75) throw new Error('Total company stock incorrect after delivery')

  // STEP 5: INVENTORY ADJUSTMENT
  console.log('\n--- Step 5: Inventory Adjustment (Reconciliation) ---')
  // We count 40 units physically at source (was 45, discrepancy: -5)
  const adj = await createAdjustment({
    locationId: locSource.id,
    notes: 'E2E Physical cycle count',
    items: [{ productId: product.id, physicalQty: 40 }],
  })
  console.log(`✓ Draft adjustment created: ${adj.reference}`)

  await validateAdjustment(adj.id)
  console.log('✓ Adjustment validated.')

  const sourceBalAfterAdj = await prisma.stockBalance.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locSource.id } },
  })
  console.log(`  Source location stock reconciled to physical count: ${sourceBalAfterAdj?.quantity} (expected 40)`)
  if (sourceBalAfterAdj?.quantity !== 40) throw new Error('Stock adjustment failed to set physical quantity')

  // STEP 6: VERIFY STOCK LEDGER ENTRIES
  console.log('\n--- Step 6: Verify Stock Ledger Audit Trail ---')
  const moves = await getStockMoves({ productId: product.id })
  console.log(`✓ Total ledger entries recorded for product: ${moves.length}`)
  moves.forEach((m) => {
    console.log(`  - [${m.date.toISOString().slice(11, 19)}] ${m.movementType.padEnd(20)}: ${m.quantity} units (Ref: ${m.reference})`)
  })

  const hasReceipt = moves.some((m) => m.movementType === 'Receipt')
  const hasTransfer = moves.some((m) => m.movementType === 'Internal Transfer')
  const hasDelivery = moves.some((m) => m.movementType === 'Delivery')
  const hasAdj = moves.some((m) => m.movementType === 'Inventory Adjustment')

  if (!hasReceipt || !hasTransfer || !hasDelivery || !hasAdj) {
    throw new Error('Missing ledger entries for some lifecycle operations!')
  }
  console.log('✓ All 4 operations (Receipt, Transfer, Delivery, Adjustment) verified in ledger!')

  // STEP 7: VERIFY DASHBOARD KPIS
  console.log('\n--- Step 7: Verify Dashboard KPIs ---')
  const stats = await getDashboardStats()
  console.log(`✓ Dashboard calculated from DB:`)
  console.log(`  - In Stock Products: ${stats.inStockCount}`)
  console.log(`  - Low Stock Alerts: ${stats.lowStockCount}`)
  console.log(`  - Out of Stock Alerts: ${stats.outOfStockCount}`)
  console.log(`  - Pending Receipts: ${stats.pendingReceipts}`)
  console.log(`  - Pending Deliveries: ${stats.pendingDeliveries}`)
  console.log(`  - Pending Transfers: ${stats.pendingTransfers}`)
  console.log(`  - Recent Moves: ${stats.recentMoves.length} moves`)

  console.log('\n======================================================')
  console.log('🎉 ALL END-TO-END LIFECYCLE TESTS PASSED SUCCESSFULLY!')
  console.log('======================================================\n')
}

runVerification()
  .catch((e) => {
    console.error('\n❌ TEST FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
