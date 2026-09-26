import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding StockSense Database ---')

  // 1. Clean existing records in correct relation order
  await prisma.stockMove.deleteMany()
  await prisma.adjustmentItem.deleteMany()
  await prisma.adjustment.deleteMany()
  await prisma.transferItem.deleteMany()
  await prisma.transfer.deleteMany()
  await prisma.deliveryItem.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.receiptItem.deleteMany()
  await prisma.receipt.deleteMany()
  await prisma.reorderRule.deleteMany()
  await prisma.stockBalance.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.location.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Odoo Admin',
      email: 'admin@stocksense.com',
      password: hashedPassword,
      role: 'admin',
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Inventory Manager',
      email: 'manager@stocksense.com',
      password: hashedPassword,
      role: 'manager',
    },
  })
  console.log('✓ Users created (admin@stocksense.com / admin123)')

  // 3. Create Warehouses & Locations
  const whMain = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center (HYD-01)',
      address: 'Plot 42, HITEC City, Hyderabad, Telangana',
    },
  })

  const whNorth = await prisma.warehouse.create({
    data: {
      name: 'North Logistics Hub (HYD-02)',
      address: 'Industrial Area, Medchal, Hyderabad, Telangana',
    },
  })

  const locMainStock = await prisma.location.create({
    data: { name: 'Stock / Shelf A-1', warehouseId: whMain.id },
  })
  const locMainBulk = await prisma.location.create({
    data: { name: 'Bulk Storage Bay-B', warehouseId: whMain.id },
  })
  const locNorthFloor = await prisma.location.create({
    data: { name: 'Floor Bay 1', warehouseId: whNorth.id },
  })
  const locNorthDock = await prisma.location.create({
    data: { name: 'Receiving Dock', warehouseId: whNorth.id },
  })
  console.log('✓ Warehouses and Locations created')

  // 4. Create Categories
  const catElectronics = await prisma.category.create({
    data: { name: 'Electronics & Computing', description: 'Hardware, monitors, peripherals' },
  })
  const catOffice = await prisma.category.create({
    data: { name: 'Office Supplies', description: 'Stationery and packaging items' },
  })
  const catSafety = await prisma.category.create({
    data: { name: 'Safety & PPE', description: 'Industrial safety gear and protective wear' },
  })
  const catTools = await prisma.category.create({
    data: { name: 'Industrial Equipment', description: 'Warehouse machinery and handheld equipment' },
  })
  console.log('✓ Product categories created')

  // 5. Create Products
  const prodLaptop = await prisma.product.create({
    data: {
      name: 'ThinkPad X1 Carbon Gen 11',
      sku: 'ELEC-LP-001',
      categoryId: catElectronics.id,
      unitOfMeasure: 'units',
      description: 'High performance enterprise ultrabook with 16GB RAM',
      reorderLevel: 5,
    },
  })

  const prodScanner = await prisma.product.create({
    data: {
      name: 'Zebra TC26 Handheld Barcode Scanner',
      sku: 'ELEC-SC-002',
      categoryId: catElectronics.id,
      unitOfMeasure: 'units',
      description: 'Enterprise Android mobile computer barcode scanner',
      reorderLevel: 8,
    },
  })

  const prodMouse = await prisma.product.create({
    data: {
      name: 'Logitech MX Master 3S Wireless Mouse',
      sku: 'ELEC-MS-003',
      categoryId: catElectronics.id,
      unitOfMeasure: 'units',
      description: 'Ergonomic precision mouse with Bluetooth & USB receiver',
      reorderLevel: 10,
    },
  })

  const prodHelmet = await prisma.product.create({
    data: {
      name: 'Industrial Hard Hat ANSI Type II',
      sku: 'SFT-HL-004',
      categoryId: catSafety.id,
      unitOfMeasure: 'units',
      description: 'High-visibility safety helmet with 4-point suspension',
      reorderLevel: 15,
    },
  })

  const prodBox = await prisma.product.create({
    data: {
      name: 'Heavy Duty Corrugated Carton 18x14x12',
      sku: 'PKG-BX-005',
      categoryId: catOffice.id,
      unitOfMeasure: 'boxes',
      description: 'Double-walled shipping box rated for 40kg',
      reorderLevel: 50,
    },
  })

  const prodLabel = await prisma.product.create({
    data: {
      name: 'Direct Thermal Shipping Labels (Roll of 500)',
      sku: 'PKG-LB-006',
      categoryId: catOffice.id,
      unitOfMeasure: 'rolls',
      description: '4x6 inch standard thermal adhesive labels',
      reorderLevel: 25,
    },
  })

  const prodCable = await prisma.product.create({
    data: {
      name: 'Ultra High Speed HDMI 2.1 Braided Cable 2M',
      sku: 'ELEC-CB-007',
      categoryId: catElectronics.id,
      unitOfMeasure: 'units',
      description: 'Supports 8K @ 60Hz with gold plated connectors',
      reorderLevel: 12,
    },
  })

  const prodPalletJack = await prisma.product.create({
    data: {
      name: 'Hydraulic Pallet Jack 2500kg Capacity',
      sku: 'IND-PJ-008',
      categoryId: catTools.id,
      unitOfMeasure: 'units',
      description: 'Heavy duty manual hand pallet truck',
      reorderLevel: 2,
    },
  })
  console.log('✓ Products created')

  // 6. Create Reorder Rules
  await prisma.reorderRule.createMany({
    data: [
      { productId: prodLaptop.id, reorderLevel: 5, reorderQty: 10 },
      { productId: prodScanner.id, reorderLevel: 8, reorderQty: 15 },
      { productId: prodMouse.id, reorderLevel: 10, reorderQty: 25 },
      { productId: prodHelmet.id, reorderLevel: 15, reorderQty: 30 },
      { productId: prodBox.id, reorderLevel: 50, reorderQty: 100 },
      { productId: prodLabel.id, reorderLevel: 25, reorderQty: 50 },
      { productId: prodCable.id, reorderLevel: 12, reorderQty: 24 },
      { productId: prodPalletJack.id, reorderLevel: 2, reorderQty: 4 },
    ],
  })
  console.log('✓ Reorder rules initialized')

  // 7. Initial Stock Balances & Initial Ledger Records
  // Laptop: 18 units at Main Stock, 4 units at North Floor (Total 22, In Stock)
  // Scanner: 4 units at Main Stock (Total 4, LOW STOCK <= 8)
  // Mouse: 35 units at Main Stock, 15 at Bulk Storage (Total 50, In Stock)
  // Helmet: 8 units at North Floor (Total 8, LOW STOCK <= 15)
  // Carton Box: 140 units at Bulk Storage (Total 140, In Stock)
  // Labels: 18 units at Main Stock (Total 18, LOW STOCK <= 25)
  // HDMI Cable: 0 units anywhere (OUT OF STOCK!)
  // Pallet Jack: 3 units at North Floor (Total 3, In Stock)

  const initialStocks = [
    { product: prodLaptop, location: locMainStock, qty: 18 },
    { product: prodLaptop, location: locNorthFloor, qty: 4 },
    { product: prodScanner, location: locMainStock, qty: 4 },
    { product: prodMouse, location: locMainStock, qty: 35 },
    { product: prodMouse, location: locMainBulk, qty: 15 },
    { product: prodHelmet, location: locNorthFloor, qty: 8 },
    { product: prodBox, location: locMainBulk, qty: 140 },
    { product: prodLabel, location: locMainStock, qty: 18 },
    { product: prodPalletJack, location: locNorthFloor, qty: 3 },
  ]

  for (const item of initialStocks) {
    await prisma.stockBalance.create({
      data: {
        productId: item.product.id,
        locationId: item.location.id,
        quantity: item.qty,
      },
    })

    await prisma.stockMove.create({
      data: {
        reference: 'INIT-SETUP-2026',
        productId: item.product.id,
        movementType: 'Receipt',
        destinationId: item.location.id,
        quantity: item.qty,
        userId: admin.id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    })
  }
  console.log('✓ Stock balances and initial ledger moves recorded')

  // 8. Create a validated sample Receipt
  const pastReceipt = await prisma.receipt.create({
    data: {
      reference: 'REC-20260920-INIT',
      status: 'validated',
      destinationId: locMainStock.id,
      notes: 'Initial vendor delivery from Lenovo & Logitech Distributors',
      userId: admin.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      validatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: prodLaptop.id, quantity: 10 },
          { productId: prodMouse.id, quantity: 20 },
        ],
      },
    },
  })

  // 9. Create a pending draft Receipt (shows in Dashboard pending receipts)
  await prisma.receipt.create({
    data: {
      reference: 'REC-20260926-DRAFT1',
      status: 'draft',
      destinationId: locNorthDock.id,
      notes: 'Incoming shipment expected from Global Safety Supplies',
      userId: manager.id,
      items: {
        create: [
          { productId: prodHelmet.id, quantity: 50 },
          { productId: prodCable.id, quantity: 60 },
        ],
      },
    },
  })

  // 10. Create a pending draft Delivery (shows in Dashboard pending deliveries)
  await prisma.delivery.create({
    data: {
      reference: 'OUT-20260926-DRAFT1',
      status: 'draft',
      sourceId: locMainStock.id,
      notes: 'Client Order #SO-8849 - Corporate Tech Refresh',
      userId: admin.id,
      items: {
        create: [
          { productId: prodLaptop.id, quantity: 3 },
          { productId: prodMouse.id, quantity: 5 },
        ],
      },
    },
  })

  // 11. Create a pending draft Internal Transfer (shows in Dashboard scheduled transfers)
  await prisma.transfer.create({
    data: {
      reference: 'TRA-20260926-DRAFT1',
      status: 'draft',
      sourceId: locMainBulk.id,
      destinationId: locMainStock.id,
      notes: 'Replenishing Shelf A-1 picking stock from bulk warehouse storage',
      userId: manager.id,
      items: {
        create: [
          { productId: prodMouse.id, quantity: 10 },
          { productId: prodBox.id, quantity: 20 },
        ],
      },
    },
  })

  // 12. Create a sample validated transfer with ledger entries
  await prisma.transfer.create({
    data: {
      reference: 'TRA-20260924-VAL1',
      status: 'validated',
      sourceId: locMainBulk.id,
      destinationId: locNorthFloor.id,
      notes: 'Transfer to North hub floor',
      userId: admin.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      validatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { productId: prodMouse.id, quantity: 5 },
        ],
      },
    },
  })

  await prisma.stockMove.create({
    data: {
      reference: 'TRA-20260924-VAL1',
      productId: prodMouse.id,
      movementType: 'Internal Transfer',
      sourceId: locMainBulk.id,
      destinationId: locNorthFloor.id,
      quantity: 5,
      userId: admin.id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('✓ Sample operations (Receipts, Deliveries, Transfers) created')
  console.log('\n=============================================')
  console.log('StockSense demo database seeded successfully!')
  console.log('Demo Login: admin@stocksense.com / admin123')
  console.log('=============================================\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
