import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'

// Demo dataset that walks through the 4-step flow from the problem statement:
// receive 100 kg steel -> move 30 kg to production rack -> deliver 20 frames -> 3 kg damaged.

const WAREHOUSES = [
  {
    id: 'wh-main', name: 'Main Store', code: 'WH-MAIN', address: 'Bay 12, Industrial Logistics Park, Sector 4', manager: 'Marcus Vance',
    locations: [
      { id: 'loc-main-rack-a', name: 'Rack A', code: 'MAIN-RACK-A', type: 'rack', capacity: 500 },
      { id: 'loc-main-rack-b', name: 'Rack B', code: 'MAIN-RACK-B', type: 'rack', capacity: 500 },
      { id: 'loc-main-bay-1', name: 'Pallet Bay 1', code: 'MAIN-BAY-01', type: 'floor', capacity: 1000 },
      { id: 'loc-main-dock', name: 'Receiving Dock', code: 'MAIN-DOCK-IN', type: 'dock', capacity: 200 },
    ],
  },
  {
    id: 'wh-prod', name: 'Production Floor', code: 'WH-PROD', address: 'Building B, Fabrication & Assembly Works', manager: 'Elena Rostova',
    locations: [
      { id: 'loc-prod-rack-1', name: 'Production Rack', code: 'PROD-RACK-01', type: 'rack', capacity: 350 },
      { id: 'loc-prod-line-1', name: 'Assembly Line A', code: 'PROD-LINE-A', type: 'floor', capacity: 150 },
      { id: 'loc-prod-scrap', name: 'Scrap & Damage Bin', code: 'PROD-SCRAP', type: 'floor', capacity: 50 },
    ],
  },
  {
    id: 'wh-02', name: 'Warehouse 2 (West Hub)', code: 'WH-02', address: 'Terminal 4, Coastal Freight Terminal', manager: 'Sarah Jenkins',
    locations: [
      { id: 'loc-wh2-bay-1', name: 'High-Bay Aisle 1', code: 'WH2-BAY-01', type: 'rack', capacity: 800 },
      { id: 'loc-wh2-bay-2', name: 'High-Bay Aisle 2', code: 'WH2-BAY-02', type: 'rack', capacity: 800 },
      { id: 'loc-wh2-ship', name: 'Outbound Staging', code: 'WH2-SHIP-STG', type: 'transit', capacity: 300 },
    ],
  },
]

const PRODUCTS = [
  { id: 'prod-steel-rods', name: 'Industrial Steel Rods (10mm)', sku: 'STL-100-ROD', category: 'Metals & Steel', unitOfMeasure: 'kg', price: 45, cost: 28.5,
    description: 'High tensile carbon steel rod used in structural frames and brackets.', rule: [30, 200, 100, true],
    stock: { 'loc-main-rack-a': 70, 'loc-prod-rack-1': 27 } },
  { id: 'prod-steel-frames', name: 'Reinforced Steel Frames', sku: 'STL-FRM-02', category: 'Finished Goods', unitOfMeasure: 'units', price: 185, cost: 110,
    description: 'Welded steel framing module for industrial workstation builds.', rule: [15, 80, 30, true],
    stock: { 'loc-main-rack-b': 20, 'loc-wh2-bay-1': 10 } },
  { id: 'prod-office-chair', name: 'Ergonomic Task Chairs (Mesh Pro)', sku: 'CHR-ERG-01', category: 'Furniture', unitOfMeasure: 'units', price: 240, cost: 145,
    description: 'Adjustable lumbar executive chair with 3D armrests.', rule: [10, 50, 20, false],
    stock: { 'loc-main-bay-1': 15 } },
  { id: 'prod-aluminum-bars', name: 'Aluminium Extrusion Bars (40x40)', sku: 'ALM-EXT-50', category: 'Raw Materials', unitOfMeasure: 'meters', price: 32.5, cost: 18,
    description: 'T-slot modular anodized aluminium structural extrusions.', rule: [25, 150, 50, true],
    stock: { 'loc-main-rack-a': 12 } },
  { id: 'prod-mcu-board', name: 'Industrial Micro-controller Core-32', sku: 'ELEC-MCU-32', category: 'Electronics', unitOfMeasure: 'pcs', price: 68, cost: 39.5,
    description: 'CAN-bus enabled industrial PLC automation controller module.', rule: [20, 100, 40, true],
    stock: { 'loc-wh2-bay-2': 6 } },
  { id: 'prod-box-large', name: 'Heavy Duty Corrugated Carton (Type L)', sku: 'PKG-BOX-L', category: 'Packaging', unitOfMeasure: 'boxes', price: 4.8, cost: 2.1,
    description: 'Double-walled export grade packing box (600x400x400mm).', rule: [50, 500, 200, true],
    stock: { 'loc-main-bay-1': 90, 'loc-wh2-ship': 50 } },
  { id: 'prod-fasteners-m6', name: 'Stainless Steel Fasteners M6x25', sku: 'HDW-FST-M6', category: 'Hardware', unitOfMeasure: 'units', price: 0.65, cost: 0.22,
    description: 'Grade 316 marine stainless hex head machine screws.', rule: [150, 1000, 400, false],
    stock: { 'loc-main-rack-b': 320, 'loc-prod-rack-1': 200 } },
  { id: 'prod-hydraulic-oil', name: 'Synthetic Hydraulic Lubricant (ISO 46)', sku: 'LUB-SYN-5L', category: 'Raw Materials', unitOfMeasure: 'liters', price: 88, cost: 54,
    description: 'Anti-wear hydraulic system fluid for CNC and press brakes.', rule: [15, 60, 30, true],
    stock: {} },
] as const

const USERS = [
  { id: 'usr-001', name: 'Marcus Vance', email: 'm.vance@stocksense.io', role: 'inventory_manager', avatar: '/images/avatar-marcus.jpg', warehouseId: 'wh-main', password: 'manager123', createdBy: 'System' },
  { id: 'usr-002', name: 'Elena Rostova', email: 'elena.r@stocksense.io', role: 'warehouse_staff', avatar: '/images/avatar-elena.jpg', warehouseId: 'wh-prod', password: 'warehouse123', createdBy: 'Marcus Vance (Inventory Manager)' },
  { id: 'usr-003', name: 'Liam Chen', email: 'liam.c@stocksense.io', role: 'warehouse_staff', avatar: '/images/avatar-liam.jpg', warehouseId: 'wh-02', password: 'staff123', createdBy: 'Marcus Vance (Inventory Manager)' },
]

const d = (s: string) => new Date(s)
const year = new Date().getFullYear()
const ref = (p: string, n: number) => `${p}-${year}-${String(n).padStart(3, '0')}`
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

/** Wipes all inventory data (users are kept) and loads the demo dataset. */
export async function seedInventory(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.stockMove.deleteMany(),
    prisma.adjustment.deleteMany(),
    prisma.operationLine.deleteMany(),
    prisma.operation.deleteMany(),
    prisma.stockQuant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.location.deleteMany(),
    prisma.warehouse.deleteMany(),
  ])

  for (const [i, w] of WAREHOUSES.entries()) {
    await prisma.warehouse.create({
      data: {
        id: w.id, name: w.name, code: w.code, address: w.address, manager: w.manager,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)),
        locations: { create: w.locations.map((l, j) => ({ ...l, createdAt: new Date(Date.UTC(2026, 0, 1, 0, i, j)) })) },
      },
    })
  }

  for (const p of PRODUCTS) {
    const [minQuantity, maxQuantity, reorderQuantity, autoReorderEnabled] = p.rule
    await prisma.product.create({
      data: {
        id: p.id, name: p.name, sku: p.sku, category: p.category, unitOfMeasure: p.unitOfMeasure,
        price: p.price, cost: p.cost, description: p.description,
        minQuantity, maxQuantity, reorderQuantity, autoReorderEnabled,
        stocks: { create: Object.entries(p.stock).map(([locationId, quantity]) => ({ locationId, quantity })) },
      },
    })
  }

  const ops = [
    { id: 'rec-001', type: 'receipt', reference: ref('REC', 1), status: 'done', partner: 'Apex Metal Alloys Ltd.', destLocationId: 'loc-main-rack-a', scheduledDate: day(-2),
      notes: 'Step 1: Receive 100 kg steel from vendor.', createdAt: d(`${day(-2)}T08:00:00Z`), validatedAt: d(`${day(-2)}T09:30:00Z`), validatedBy: 'Marcus Vance',
      lines: [{ productId: 'prod-steel-rods', demandQty: 100, doneQty: 100 }] },
    { id: 'rec-002', type: 'receipt', reference: ref('REC', 2), status: 'ready', partner: 'Nordic Electronics Corp.', destLocationId: 'loc-wh2-bay-2', scheduledDate: day(0),
      notes: 'Urgent restock to resolve low stock status.', createdAt: d(`${day(-1)}T11:00:00Z`),
      lines: [{ productId: 'prod-mcu-board', demandQty: 40, doneQty: 0 }] },
    { id: 'rec-003', type: 'receipt', reference: ref('REC', 3), status: 'waiting', partner: 'Global Lubricants Direct', destLocationId: 'loc-main-rack-b', scheduledDate: day(1),
      notes: 'Awaiting customs clearance at port.', createdAt: d(`${day(-1)}T13:45:00Z`),
      lines: [{ productId: 'prod-hydraulic-oil', demandQty: 30, doneQty: 0 }] },
    { id: 'del-001', type: 'delivery', reference: ref('DEL', 1), status: 'done', partner: 'Apex Modern Workspaces Inc.', sourceLocationId: 'loc-main-bay-1', scheduledDate: day(-2),
      isPicked: true, isPacked: true, shippingAddress: '400 Enterprise Way, Suite 200, Tech Park',
      notes: 'Sales order for 10 chairs.', createdAt: d(`${day(-2)}T10:00:00Z`), validatedAt: d(`${day(-2)}T14:15:00Z`), validatedBy: 'Marcus Vance',
      lines: [{ productId: 'prod-office-chair', demandQty: 10, doneQty: 10 }] },
    { id: 'del-002', type: 'delivery', reference: ref('DEL', 2), status: 'done', partner: 'Vanguard Industrial Builders', sourceLocationId: 'loc-main-rack-b', scheduledDate: day(-1),
      isPicked: true, isPacked: true, shippingAddress: 'Gate 8, Port Construction Site A',
      notes: 'Step 3: Deliver 20 steel frames.', createdAt: d(`${day(-1)}T09:00:00Z`), validatedAt: d(`${day(-1)}T11:45:00Z`), validatedBy: 'Marcus Vance',
      lines: [{ productId: 'prod-steel-frames', demandQty: 20, doneQty: 20 }] },
    { id: 'del-003', type: 'delivery', reference: ref('DEL', 3), status: 'waiting', partner: 'Pacific Modular Systems', sourceLocationId: 'loc-wh2-bay-1', scheduledDate: day(2),
      isPicked: true, isPacked: false, shippingAddress: '88 Harbor Freight Road, Dock 3',
      notes: 'Items picked; awaiting packing.', createdAt: d(`${day(-1)}T15:20:00Z`),
      lines: [{ productId: 'prod-steel-frames', demandQty: 5, doneQty: 0 }] },
    { id: 'trf-001', type: 'internal', reference: ref('TRF', 1), status: 'done', sourceLocationId: 'loc-main-rack-a', destLocationId: 'loc-prod-rack-1', scheduledDate: day(-2),
      notes: 'Step 2: Main Store -> Production Rack. Total stock unchanged.', createdAt: d(`${day(-2)}T12:00:00Z`), validatedAt: d(`${day(-2)}T13:30:00Z`), validatedBy: 'Elena Rostova',
      lines: [{ productId: 'prod-steel-rods', demandQty: 30, doneQty: 30 }] },
    { id: 'trf-002', type: 'internal', reference: ref('TRF', 2), status: 'ready', sourceLocationId: 'loc-main-rack-a', destLocationId: 'loc-main-rack-b', scheduledDate: day(0),
      notes: 'Rack A to Rack B aisle reorganization.', createdAt: d(`${day(-1)}T14:00:00Z`),
      lines: [{ productId: 'prod-steel-rods', demandQty: 15, doneQty: 0 }] },
  ]
  for (const { lines, ...op } of ops) {
    await prisma.operation.create({ data: { ...op, lines: { create: lines } } })
  }

  await prisma.adjustment.create({
    data: {
      id: 'adj-001', reference: ref('ADJ', 1), locationId: 'loc-prod-rack-1', productId: 'prod-steel-rods',
      recordedQty: 30, countedQty: 27, reason: 'damaged', status: 'done',
      notes: 'Step 4: 3 kg steel damaged.', createdAt: d(`${day(-1)}T14:00:00Z`), validatedAt: d(`${day(-1)}T14:10:00Z`), validatedBy: 'Elena Rostova',
    },
  })

  const move = (m: { t: string; reference: string; operationType: string; productId: string; fromLocation: string; toLocation: string; quantity: number; performedBy: string; notes: string }) => {
    const p = PRODUCTS.find((x) => x.id === m.productId)!
    return {
      timestamp: d(m.t), reference: m.reference, operationType: m.operationType, productId: p.id, productName: p.name, sku: p.sku,
      fromLocation: m.fromLocation, toLocation: m.toLocation, quantity: m.quantity, unitOfMeasure: p.unitOfMeasure, performedBy: m.performedBy, notes: m.notes,
    }
  }
  await prisma.stockMove.createMany({
    data: [
      move({ t: `${day(-2)}T09:30:00Z`, reference: ref('REC', 1), operationType: 'receipt', productId: 'prod-steel-rods', fromLocation: 'Vendor (Apex Metal Alloys Ltd.)', toLocation: 'Main Store - Rack A', quantity: 100, performedBy: 'Marcus Vance', notes: 'Receive 100 kg steel: stock +100' }),
      move({ t: `${day(-2)}T13:30:00Z`, reference: ref('TRF', 1), operationType: 'internal', productId: 'prod-steel-rods', fromLocation: 'Main Store - Rack A', toLocation: 'Production Floor - Production Rack', quantity: 30, performedBy: 'Elena Rostova', notes: 'Move to production rack: total unchanged' }),
      move({ t: `${day(-2)}T14:15:00Z`, reference: ref('DEL', 1), operationType: 'delivery', productId: 'prod-office-chair', fromLocation: 'Main Store - Pallet Bay 1', toLocation: 'Customer (Apex Modern Workspaces Inc.)', quantity: -10, performedBy: 'Marcus Vance', notes: 'Sales order for 10 chairs: stock -10' }),
      move({ t: `${day(-1)}T11:45:00Z`, reference: ref('DEL', 2), operationType: 'delivery', productId: 'prod-steel-frames', fromLocation: 'Main Store - Rack B', toLocation: 'Customer (Vanguard Industrial Builders)', quantity: -20, performedBy: 'Marcus Vance', notes: 'Deliver 20 steel frames: stock -20' }),
      move({ t: `${day(-1)}T14:10:00Z`, reference: ref('ADJ', 1), operationType: 'adjustment', productId: 'prod-steel-rods', fromLocation: 'Production Floor - Production Rack', toLocation: 'Inventory Adjustment (Damaged Goods Scrapped)', quantity: -3, performedBy: 'Elena Rostova', notes: '3 kg steel damaged: stock -3' }),
    ],
  })
}

/** Creates the demo accounts if they do not exist yet. */
export async function seedUsers(prisma: PrismaClient) {
  for (const u of USERS) {
    const { password, ...rest } = u
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
    })
  }
}
