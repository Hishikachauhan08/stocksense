import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  StockMoveHistory,
  Warehouse,
  UserProfile,
  Role,
  DashboardKPIs,
  FilterOptions,
  LowStockAlert,
  OperationStatus,
} from '../types/inventory';
import { sound } from '../utils/audio';

const STORAGE_KEY_PREFIX = 'stocksense_ims_data_v1';

// Initial Seed Data mirroring PDF specifications
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-main',
    name: 'Main Store',
    code: 'WH-MAIN',
    address: 'Bay 12, Industrial Logistics Park, Sector 4',
    manager: 'Marcus Vance',
    locations: [
      { id: 'loc-main-rack-a', name: 'Rack A', warehouseId: 'wh-main', code: 'MAIN-RACK-A', type: 'rack', capacity: 500 },
      { id: 'loc-main-rack-b', name: 'Rack B', warehouseId: 'wh-main', code: 'MAIN-RACK-B', type: 'rack', capacity: 500 },
      { id: 'loc-main-bay-1', name: 'Pallet Bay 1', warehouseId: 'wh-main', code: 'MAIN-BAY-01', type: 'floor', capacity: 1000 },
      { id: 'loc-main-dock', name: 'Receiving Dock', warehouseId: 'wh-main', code: 'MAIN-DOCK-IN', type: 'dock', capacity: 200 },
    ],
  },
  {
    id: 'wh-prod',
    name: 'Production Floor',
    code: 'WH-PROD',
    address: 'Building B, Fabrication & Assembly Works',
    manager: 'Elena Rostova',
    locations: [
      { id: 'loc-prod-rack-1', name: 'Production Rack', warehouseId: 'wh-prod', code: 'PROD-RACK-01', type: 'rack', capacity: 350 },
      { id: 'loc-prod-line-1', name: 'Assembly Line A', warehouseId: 'wh-prod', code: 'PROD-LINE-A', type: 'floor', capacity: 150 },
      { id: 'loc-prod-scrap', name: 'Scrap & Damage Bin', warehouseId: 'wh-prod', code: 'PROD-SCRAP', type: 'floor', capacity: 50 },
    ],
  },
  {
    id: 'wh-02',
    name: 'Warehouse 2 (West Hub)',
    code: 'WH-02',
    address: 'Terminal 4, Coastal Freight Terminal',
    manager: 'Sarah Jenkins',
    locations: [
      { id: 'loc-wh2-bay-1', name: 'High-Bay Aisle 1', warehouseId: 'wh-02', code: 'WH2-BAY-01', type: 'rack', capacity: 800 },
      { id: 'loc-wh2-bay-2', name: 'High-Bay Aisle 2', warehouseId: 'wh-02', code: 'WH2-BAY-02', type: 'rack', capacity: 800 },
      { id: 'loc-wh2-ship', name: 'Outbound Staging', warehouseId: 'wh-02', code: 'WH2-SHIP-STG', type: 'transit', capacity: 300 },
    ],
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-steel-rods',
    name: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    category: 'Metals & Steel',
    unitOfMeasure: 'kg',
    price: 45.0,
    cost: 28.5,
    description: 'High tensile carbon steel rod used in structural frames and brackets.',
    totalStock: 97, // 100 received - 3 damaged = 97
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-rack-a', quantity: 67 },
      { warehouseId: 'wh-prod', locationId: 'loc-prod-rack-1', quantity: 30 },
    ],
    reorderingRule: {
      minQuantity: 30,
      maxQuantity: 200,
      reorderQuantity: 100,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-25T14:30:00.000Z',
  },
  {
    id: 'prod-steel-frames',
    name: 'Reinforced Steel Frames',
    sku: 'STL-FRM-02',
    category: 'Finished Goods',
    unitOfMeasure: 'units',
    price: 185.0,
    cost: 110.0,
    description: 'Welded steel framing module for industrial workstation builds.',
    totalStock: 30, // 50 initial - 20 delivered = 30
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-rack-b', quantity: 20 },
      { warehouseId: 'wh-02', locationId: 'loc-wh2-bay-1', quantity: 10 },
    ],
    reorderingRule: {
      minQuantity: 15,
      maxQuantity: 80,
      reorderQuantity: 30,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-05T09:15:00.000Z',
    updatedAt: '2026-09-25T16:00:00.000Z',
  },
  {
    id: 'prod-office-chair',
    name: 'Ergonomic Task Chairs (Mesh Pro)',
    sku: 'CHR-ERG-01',
    category: 'Furniture',
    unitOfMeasure: 'units',
    price: 240.0,
    cost: 145.0,
    description: 'Adjustable lumbar executive chair with 3D armrests.',
    totalStock: 15, // 25 initial - 10 delivered = 15
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-bay-1', quantity: 15 },
    ],
    reorderingRule: {
      minQuantity: 10,
      maxQuantity: 50,
      reorderQuantity: 20,
      autoReorderEnabled: false,
    },
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-25T11:20:00.000Z',
  },
  {
    id: 'prod-aluminum-bars',
    name: 'Aluminium Extrusion Bars (40x40)',
    sku: 'ALM-EXT-50',
    category: 'Raw Materials',
    unitOfMeasure: 'meters',
    price: 32.5,
    cost: 18.0,
    description: 'T-slot modular anodized aluminium structural extrusions.',
    totalStock: 12, // LOW STOCK! min is 25
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-rack-a', quantity: 12 },
    ],
    reorderingRule: {
      minQuantity: 25,
      maxQuantity: 150,
      reorderQuantity: 50,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-12T11:00:00.000Z',
    updatedAt: '2026-09-24T18:00:00.000Z',
  },
  {
    id: 'prod-mcu-board',
    name: 'Industrial Micro-controller Core-32',
    sku: 'ELEC-MCU-32',
    category: 'Electronics',
    unitOfMeasure: 'pcs',
    price: 68.0,
    cost: 39.5,
    description: 'CAN-bus enabled industrial PLC automation controller module.',
    totalStock: 6, // LOW STOCK! min is 20
    locationStocks: [
      { warehouseId: 'wh-02', locationId: 'loc-wh2-bay-2', quantity: 6 },
    ],
    reorderingRule: {
      minQuantity: 20,
      maxQuantity: 100,
      reorderQuantity: 40,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-14T14:20:00.000Z',
    updatedAt: '2026-09-25T09:40:00.000Z',
  },
  {
    id: 'prod-box-large',
    name: 'Heavy Duty Corrugated Carton (Type L)',
    sku: 'PKG-BOX-L',
    category: 'Packaging',
    unitOfMeasure: 'boxes',
    price: 4.8,
    cost: 2.1,
    description: 'Double-walled export grade packing box (600x400x400mm).',
    totalStock: 140,
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-bay-1', quantity: 90 },
      { warehouseId: 'wh-02', locationId: 'loc-wh2-ship', quantity: 50 },
    ],
    reorderingRule: {
      minQuantity: 50,
      maxQuantity: 500,
      reorderQuantity: 200,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-02T13:00:00.000Z',
    updatedAt: '2026-09-25T10:00:00.000Z',
  },
  {
    id: 'prod-fasteners-m6',
    name: 'Stainless Steel Fasteners M6x25',
    sku: 'HDW-FST-M6',
    category: 'Hardware',
    unitOfMeasure: 'units',
    price: 0.65,
    cost: 0.22,
    description: 'Grade 316 marine stainless hex head machine screws.',
    totalStock: 520,
    locationStocks: [
      { warehouseId: 'wh-main', locationId: 'loc-main-rack-b', quantity: 320 },
      { warehouseId: 'wh-prod', locationId: 'loc-prod-rack-1', quantity: 200 },
    ],
    reorderingRule: {
      minQuantity: 150,
      maxQuantity: 1000,
      reorderQuantity: 400,
      autoReorderEnabled: false,
    },
    createdAt: '2026-09-03T16:00:00.000Z',
    updatedAt: '2026-09-25T08:15:00.000Z',
  },
  {
    id: 'prod-hydraulic-oil',
    name: 'Synthetic Hydraulic Lubricant (ISO 46)',
    sku: 'LUB-SYN-5L',
    category: 'Raw Materials',
    unitOfMeasure: 'liters',
    price: 88.0,
    cost: 54.0,
    description: 'Anti-wear hydraulic system fluid for CNC and press brakes.',
    totalStock: 0, // OUT OF STOCK!
    locationStocks: [],
    reorderingRule: {
      minQuantity: 15,
      maxQuantity: 60,
      reorderQuantity: 30,
      autoReorderEnabled: true,
    },
    createdAt: '2026-09-04T12:00:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z',
  },
];

const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rec-001',
    referenceNumber: 'REC-2026-001',
    supplier: 'Apex Metal Alloys Ltd.',
    warehouseId: 'wh-main',
    destLocationId: 'loc-main-rack-a',
    scheduledDate: '2026-09-24',
    status: 'done',
    items: [
      {
        productId: 'prod-steel-rods',
        productName: 'Industrial Steel Rods (10mm)',
        sku: 'STL-100-ROD',
        unitOfMeasure: 'kg',
        demandQty: 100,
        doneQty: 100,
        destLocationId: 'loc-main-rack-a',
      },
    ],
    notes: 'Initial bulk shipment for Q3 production as in PDF flow Step 1.',
    createdAt: '2026-09-24T08:00:00.000Z',
    validatedAt: '2026-09-24T09:30:00.000Z',
    validatedBy: 'Marcus Vance',
  },
  {
    id: 'rec-002',
    referenceNumber: 'REC-2026-002',
    supplier: 'Nordic Electronics Corp.',
    warehouseId: 'wh-02',
    destLocationId: 'loc-wh2-bay-2',
    scheduledDate: '2026-09-26',
    status: 'ready',
    items: [
      {
        productId: 'prod-mcu-board',
        productName: 'Industrial Micro-controller Core-32',
        sku: 'ELEC-MCU-32',
        unitOfMeasure: 'pcs',
        demandQty: 40,
        doneQty: 0,
        destLocationId: 'loc-wh2-bay-2',
      },
    ],
    notes: 'Urgent restock to resolve low stock status.',
    createdAt: '2026-09-25T11:00:00.000Z',
  },
  {
    id: 'rec-003',
    referenceNumber: 'REC-2026-003',
    supplier: 'Global Lubricants Direct',
    warehouseId: 'wh-main',
    destLocationId: 'loc-main-rack-b',
    scheduledDate: '2026-09-27',
    status: 'waiting',
    items: [
      {
        productId: 'prod-hydraulic-oil',
        productName: 'Synthetic Hydraulic Lubricant (ISO 46)',
        sku: 'LUB-SYN-5L',
        unitOfMeasure: 'liters',
        demandQty: 30,
        doneQty: 0,
        destLocationId: 'loc-main-rack-b',
      },
    ],
    notes: 'Awaiting customs clearance at port.',
    createdAt: '2026-09-25T13:45:00.000Z',
  },
];

const INITIAL_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'del-001',
    referenceNumber: 'DEL-2026-001',
    customer: 'Apex Modern Workspaces Inc.',
    warehouseId: 'wh-main',
    sourceLocationId: 'loc-main-bay-1',
    scheduledDate: '2026-09-24',
    status: 'done',
    isPicked: true,
    isPacked: true,
    shippingAddress: '400 Enterprise Way, Suite 200, Tech Park',
    items: [
      {
        productId: 'prod-office-chair',
        productName: 'Ergonomic Task Chairs (Mesh Pro)',
        sku: 'CHR-ERG-01',
        unitOfMeasure: 'units',
        demandQty: 10,
        doneQty: 10,
        sourceLocationId: 'loc-main-bay-1',
      },
    ],
    notes: 'Sales order for 10 chairs -> Delivery order reduces chairs by 10 (PDF Example).',
    createdAt: '2026-09-24T10:00:00.000Z',
    validatedAt: '2026-09-24T14:15:00.000Z',
    validatedBy: 'Marcus Vance',
  },
  {
    id: 'del-002',
    referenceNumber: 'DEL-2026-002',
    customer: 'Vanguard Industrial Builders',
    warehouseId: 'wh-main',
    sourceLocationId: 'loc-main-rack-b',
    scheduledDate: '2026-09-25',
    status: 'done',
    isPicked: true,
    isPacked: true,
    shippingAddress: 'Gate 8, Port Construction Site A',
    items: [
      {
        productId: 'prod-steel-frames',
        productName: 'Reinforced Steel Frames',
        sku: 'STL-FRM-02',
        unitOfMeasure: 'units',
        demandQty: 20,
        doneQty: 20,
        sourceLocationId: 'loc-main-rack-b',
      },
    ],
    notes: 'Step 3 in PDF: Deliver 20 steel frames -> Stock: -20.',
    createdAt: '2026-09-25T09:00:00.000Z',
    validatedAt: '2026-09-25T11:45:00.000Z',
    validatedBy: 'Marcus Vance',
  },
  {
    id: 'del-003',
    referenceNumber: 'DEL-2026-003',
    customer: 'Pacific Modular Systems',
    warehouseId: 'wh-02',
    sourceLocationId: 'loc-wh2-bay-1',
    scheduledDate: '2026-09-28',
    status: 'ready',
    isPicked: true,
    isPacked: false,
    shippingAddress: '88 Harbor Freight Road, Dock 3',
    items: [
      {
        productId: 'prod-steel-frames',
        productName: 'Reinforced Steel Frames',
        sku: 'STL-FRM-02',
        unitOfMeasure: 'units',
        demandQty: 5,
        doneQty: 5,
        sourceLocationId: 'loc-wh2-bay-1',
      },
    ],
    notes: 'Items picked; awaiting packaging dispatch.',
    createdAt: '2026-09-25T15:20:00.000Z',
  },
];

const INITIAL_TRANSFERS: InternalTransfer[] = [
  {
    id: 'trf-001',
    referenceNumber: 'TRF-2026-001',
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-main-rack-a',
    destWarehouseId: 'wh-prod',
    destLocationId: 'loc-prod-rack-1',
    scheduledDate: '2026-09-24',
    status: 'done',
    items: [
      {
        productId: 'prod-steel-rods',
        productName: 'Industrial Steel Rods (10mm)',
        sku: 'STL-100-ROD',
        unitOfMeasure: 'kg',
        demandQty: 30,
        doneQty: 30,
        sourceLocationId: 'loc-main-rack-a',
        destLocationId: 'loc-prod-rack-1',
      },
    ],
    purpose: 'Step 2 in PDF: Internal transfer: Main Store -> Production Rack. Stock total unchanged.',
    createdAt: '2026-09-24T12:00:00.000Z',
    validatedAt: '2026-09-24T13:30:00.000Z',
    validatedBy: 'Elena Rostova',
  },
  {
    id: 'trf-002',
    referenceNumber: 'TRF-2026-002',
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-main-rack-a',
    destWarehouseId: 'wh-main',
    destLocationId: 'loc-main-rack-b',
    scheduledDate: '2026-09-26',
    status: 'ready',
    items: [
      {
        productId: 'prod-steel-rods',
        productName: 'Industrial Steel Rods (10mm)',
        sku: 'STL-100-ROD',
        unitOfMeasure: 'kg',
        demandQty: 15,
        doneQty: 0,
        sourceLocationId: 'loc-main-rack-a',
        destLocationId: 'loc-main-rack-b',
      },
    ],
    purpose: 'Rack A to Rack B aisle reorganization (PDF example).',
    createdAt: '2026-09-25T14:00:00.000Z',
  },
];

const INITIAL_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-001',
    referenceNumber: 'ADJ-2026-001',
    warehouseId: 'wh-prod',
    locationId: 'loc-prod-rack-1',
    productId: 'prod-steel-rods',
    productName: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    unitOfMeasure: 'kg',
    recordedQty: 33,
    countedQty: 30,
    differenceQty: -3,
    reason: 'damaged',
    notes: 'Step 4 in PDF: 3 kg steel damaged -> Stock: -3. Logged in Stock Ledger.',
    status: 'done',
    createdAt: '2026-09-25T14:00:00.000Z',
    validatedAt: '2026-09-25T14:10:00.000Z',
    validatedBy: 'Elena Rostova',
  },
];

const INITIAL_MOVES: StockMoveHistory[] = [
  {
    id: 'move-001',
    timestamp: '2026-09-24T09:30:00.000Z',
    referenceNumber: 'REC-2026-001',
    operationType: 'receipt',
    productId: 'prod-steel-rods',
    productName: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    fromLocation: 'Vendor (Apex Metal Alloys)',
    toLocation: 'Main Store - Rack A',
    quantity: 100,
    unitOfMeasure: 'kg',
    performedBy: 'Marcus Vance',
    notes: 'PDF Step 1: Receive 100 kg Steel -> Stock: +100',
  },
  {
    id: 'move-002',
    timestamp: '2026-09-24T13:30:00.000Z',
    referenceNumber: 'TRF-2026-001',
    operationType: 'internal',
    productId: 'prod-steel-rods',
    productName: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    fromLocation: 'Main Store - Rack A',
    toLocation: 'Production Floor - Production Rack',
    quantity: 30,
    unitOfMeasure: 'kg',
    performedBy: 'Elena Rostova',
    notes: 'PDF Step 2: Move to production rack (Main Store -> Production Rack)',
  },
  {
    id: 'move-003',
    timestamp: '2026-09-24T14:15:00.000Z',
    referenceNumber: 'DEL-2026-001',
    operationType: 'delivery',
    productId: 'prod-office-chair',
    productName: 'Ergonomic Task Chairs (Mesh Pro)',
    sku: 'CHR-ERG-01',
    fromLocation: 'Main Store - Pallet Bay 1',
    toLocation: 'Customer (Apex Modern Workspaces)',
    quantity: -10,
    unitOfMeasure: 'units',
    performedBy: 'Marcus Vance',
    notes: 'PDF Example: Sales order for 10 chairs -> Delivery order reduces chairs by 10',
  },
  {
    id: 'move-004',
    timestamp: '2026-09-25T11:45:00.000Z',
    referenceNumber: 'DEL-2026-002',
    operationType: 'delivery',
    productId: 'prod-steel-frames',
    productName: 'Reinforced Steel Frames',
    sku: 'STL-FRM-02',
    fromLocation: 'Main Store - Rack B',
    toLocation: 'Customer (Vanguard Builders)',
    quantity: -20,
    unitOfMeasure: 'units',
    performedBy: 'Marcus Vance',
    notes: 'PDF Step 3: Deliver finished goods -> Deliver 20 steel frames: -20',
  },
  {
    id: 'move-005',
    timestamp: '2026-09-25T14:10:00.000Z',
    referenceNumber: 'ADJ-2026-001',
    operationType: 'adjustment',
    productId: 'prod-steel-rods',
    productName: 'Industrial Steel Rods (10mm)',
    sku: 'STL-100-ROD',
    fromLocation: 'Production Floor - Production Rack',
    toLocation: 'Inventory Loss (Damaged Goods)',
    quantity: -3,
    unitOfMeasure: 'kg',
    performedBy: 'Elena Rostova',
    notes: 'PDF Step 4: Adjust damaged items: 3 kg steel damaged -> Stock: -3',
  },
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-001',
    name: 'Marcus Vance',
    email: 'm.vance@stocksense.io',
    role: 'inventory_manager',
    avatar: '/src/assets/images/avatar_marcus_vance_1790396664217.jpg',
    warehouseId: 'wh-main',
    password: 'manager123',
    createdBy: 'System Root',
    mustChangePassword: false,
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'usr-002',
    name: 'Elena Rostova',
    email: 'elena.r@stocksense.io',
    role: 'warehouse_staff',
    avatar: '/src/assets/images/avatar_elena_rostova_1790396674868.jpg',
    warehouseId: 'wh-prod',
    password: 'warehouse123',
    createdBy: 'Marcus Vance (Manager)',
    mustChangePassword: false,
    createdAt: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'usr-003',
    name: 'Liam Chen',
    email: 'liam.c@stocksense.io',
    role: 'warehouse_staff',
    avatar: '/src/assets/images/avatar_liam_chen_1790396692095.jpg',
    warehouseId: 'wh-02',
    password: 'staff123',
    createdBy: 'Marcus Vance (Manager)',
    mustChangePassword: false,
    createdAt: '2026-09-05T14:30:00.000Z',
  },
];

const INITIAL_USER: UserProfile = INITIAL_USERS[0];

interface InventoryContextType {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  role: Role;
  setRole: (role: Role) => void;
  users: UserProfile[];
  activeView: 'landing' | 'app';
  setActiveView: (view: 'landing' | 'app') => void;
  warehouses: Warehouse[];
  products: Product[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: StockAdjustment[];
  moveHistory: StockMoveHistory[];
  kpis: DashboardKPIs;
  lowStockAlerts: LowStockAlert[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Active Filter state
  activeFilters: FilterOptions;
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;

  // Staff Account Provisioning by Manager (Only Inventory Manager can create accounts)
  createStaffAccount: (data: {
    name: string;
    email: string;
    role: Role;
    warehouseId: string;
    temporaryPassword?: string;
  }) => { user: UserProfile; temporaryPassword: string };
  updateUserCredentials: (
    userId: string,
    updates: { name?: string; email?: string; password?: string; warehouseId?: string }
  ) => void;
  deleteUserAccount: (userId: string) => void;

  // Product Operations
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'> & { initialLocationStocks?: { warehouseId: string; locationId: string; quantity: number }[] }) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Receipt Operations
  createReceipt: (data: Omit<Receipt, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) => Receipt;
  updateReceiptStatus: (id: string, status: OperationStatus) => void;
  validateReceipt: (id: string) => void;

  // Delivery Operations
  createDelivery: (data: Omit<DeliveryOrder, 'id' | 'referenceNumber' | 'status' | 'isPicked' | 'isPacked' | 'createdAt'>) => DeliveryOrder;
  updateDeliveryPicking: (id: string, isPicked: boolean) => void;
  updateDeliveryPacking: (id: string, isPacked: boolean) => void;
  updateDeliveryStatus: (id: string, status: OperationStatus) => void;
  validateDelivery: (id: string) => void;

  // Internal Transfer Operations
  createTransfer: (data: Omit<InternalTransfer, 'id' | 'referenceNumber' | 'status' | 'createdAt'>) => InternalTransfer;
  updateTransferStatus: (id: string, status: OperationStatus) => void;
  validateTransfer: (id: string) => void;

  // Stock Adjustment Operations
  createAdjustment: (data: Omit<StockAdjustment, 'id' | 'referenceNumber' | 'differenceQty' | 'status' | 'createdAt'>) => StockAdjustment;
  validateAdjustment: (id: string) => void;

  // Warehouse Operations
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  addLocationToWarehouse: (warehouseId: string, location: Omit<Warehouse['locations'][0], 'id' | 'warehouseId'>) => void;

  // Quick Tools & Guided Tour
  resetToInitialDemo: () => void;
  getLocationName: (locationId?: string) => string;
  getWarehouseName: (warehouseId?: string) => string;
  triggerQuickReorder: (productId: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_user`);
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [activeView, setActiveView] = useState<'landing' | 'app'>('landing');

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_warehouses`);
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_products`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_receipts`);
    return saved ? JSON.parse(saved) : INITIAL_RECEIPTS;
  });

  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_deliveries`);
    return saved ? JSON.parse(saved) : INITIAL_DELIVERIES;
  });

  const [transfers, setTransfers] = useState<InternalTransfer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_transfers`);
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_adjustments`);
    return saved ? JSON.parse(saved) : INITIAL_ADJUSTMENTS;
  });

  const [moveHistory, setMoveHistory] = useState<StockMoveHistory[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_moves`);
    return saved ? JSON.parse(saved) : INITIAL_MOVES;
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_sound`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    documentType: 'all',
    status: 'all',
    warehouseId: 'all',
    category: 'all',
    searchQuery: '',
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sound.enabled = enabled;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_sound`, JSON.stringify(enabled));
  };

  const setRole = (role: Role) => {
    const updatedUser = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_user`, JSON.stringify(updatedUser));
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_user`, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_users`, JSON.stringify(users));
  }, [users]);

  // Only Inventory Manager can create accounts for warehouse staff/managers
  const createStaffAccount = (data: {
    name: string;
    email: string;
    role: Role;
    warehouseId: string;
    temporaryPassword?: string;
  }): { user: UserProfile; temporaryPassword: string } => {
    const tempPassword = data.temporaryPassword || `staff${Math.floor(1000 + Math.random() * 9000)}`;
    const avatars = [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: randomAvatar,
      warehouseId: data.warehouseId,
      password: tempPassword,
      createdBy: `${user.name} (Inventory Manager)`,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    sound.playSuccess();
    return { user: newUser, temporaryPassword: tempPassword };
  };

  const updateUserCredentials = (
    userId: string,
    updates: { name?: string; email?: string; password?: string; warehouseId?: string }
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            ...updates,
            mustChangePassword: updates.password ? false : u.mustChangePassword,
          };
          // Also update active session if current user
          if (user.id === userId) {
            setUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    sound.playSuccess();
  };

  const deleteUserAccount = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    sound.playBeep();
  };

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_warehouses`, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_receipts`, JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_deliveries`, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_transfers`, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_adjustments`, JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_moves`, JSON.stringify(moveHistory));
  }, [moveHistory]);

  const resetFilters = () => {
    setActiveFilters({
      documentType: 'all',
      status: 'all',
      warehouseId: 'all',
      category: 'all',
      searchQuery: '',
    });
  };

  // Helper mappings
  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'Unknown Location';
    for (const wh of warehouses) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return `${wh.name} (${loc.name})`;
    }
    return locationId;
  };

  const getWarehouseName = (warehouseId?: string) => {
    if (!warehouseId || warehouseId === 'all') return 'All Warehouses';
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : warehouseId;
  };

  // Dashboard KPIs calculation
  const kpis: DashboardKPIs = useMemo(() => {
    let totalUnits = 0;
    let valuation = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      totalUnits += p.totalStock;
      valuation += p.totalStock * p.price;
      if (p.totalStock === 0) {
        outOfStock++;
      } else if (p.totalStock <= p.reorderingRule.minQuantity) {
        lowStock++;
      }
    });

    const pendingReceipts = receipts.filter((r) => r.status !== 'done' && r.status !== 'canceled').length;
    const pendingDeliveries = deliveries.filter((d) => d.status !== 'done' && d.status !== 'canceled').length;
    const scheduledTransfers = transfers.filter((t) => t.status !== 'done' && t.status !== 'canceled').length;

    return {
      totalProductsCount: products.length,
      totalUnitsInStock: totalUnits,
      lowStockItemsCount: lowStock,
      outOfStockItemsCount: outOfStock,
      pendingReceiptsCount: pendingReceipts,
      pendingDeliveriesCount: pendingDeliveries,
      internalTransfersScheduledCount: scheduledTransfers,
      totalInventoryValuation: valuation,
    };
  }, [products, receipts, deliveries, transfers]);

  // Low stock alerts list
  const lowStockAlerts: LowStockAlert[] = useMemo(() => {
    return products
      .filter((p) => p.totalStock <= p.reorderingRule.minQuantity)
      .map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.totalStock,
        minQuantity: p.reorderingRule.minQuantity,
        recommendedReorder: p.reorderingRule.reorderQuantity,
        unitOfMeasure: p.unitOfMeasure,
      }));
  }, [products]);

  // Product Operations
  const addProduct = (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalStock'> & {
      initialLocationStocks?: { warehouseId: string; locationId: string; quantity: number }[];
    }
  ): Product => {
    const locStocks = data.initialLocationStocks || [];
    const total = locStocks.reduce((sum, item) => sum + item.quantity, 0);
    const now = new Date().toISOString();

    const newProd: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      totalStock: total,
      locationStocks: locStocks,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProd, ...prev]);

    // If initial stock was provided, log as receipt/opening balance
    if (total > 0 && locStocks.length > 0) {
      const primaryLoc = locStocks[0];
      const initialMove: StockMoveHistory = {
        id: `move-${Date.now()}`,
        timestamp: now,
        referenceNumber: `INIT-${newProd.sku}`,
        operationType: 'receipt',
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        fromLocation: 'Initial Stock / Opening Balance',
        toLocation: getLocationName(primaryLoc.locationId),
        quantity: total,
        unitOfMeasure: newProd.unitOfMeasure,
        performedBy: user.name,
        notes: 'Initial inventory intake upon product creation',
      };
      setMoveHistory((prev) => [initialMove, ...prev]);
    }

    sound.playSuccess();
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
          // Recalculate total if locationStocks was modified
          if (updates.locationStocks) {
            updated.totalStock = updates.locationStocks.reduce((sum, item) => sum + item.quantity, 0);
          }
          return updated;
        }
        return p;
      })
    );
    sound.playBeep();
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    sound.playBeep();
  };

  // Receipt Operations
  const createReceipt = (data: Omit<Receipt, 'id' | 'referenceNumber' | 'status' | 'createdAt'>): Receipt => {
    const count = receipts.length + 1;
    const refNum = `REC-2026-${String(count).padStart(3, '0')}`;
    const newReceipt: Receipt = {
      ...data,
      id: `rec-${Date.now()}`,
      referenceNumber: refNum,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [newReceipt, ...prev]);
    sound.playBeep();
    return newReceipt;
  };

  const updateReceiptStatus = (id: string, status: OperationStatus) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    sound.playBeep();
  };

  // PDF Step 1: Validate -> stock increases automatically!
  const validateReceipt = (id: string) => {
    const target = receipts.find((r) => r.id === id);
    if (!target || target.status === 'done') return;

    const now = new Date().toISOString();
    const targetWarehouse = target.warehouseId;
    const targetLoc = target.destLocationId;

    // 1. Update product stocks
    setProducts((prev) => {
      const updated = [...prev];
      target.items.forEach((item) => {
        const prodIndex = updated.findIndex((p) => p.id === item.productId);
        if (prodIndex !== -1) {
          const prod = { ...updated[prodIndex] };
          const qtyToAdd = item.doneQty > 0 ? item.doneQty : item.demandQty;

          // Check if location stock exists
          const locStocks = [...prod.locationStocks];
          const existingLocIndex = locStocks.findIndex(
            (ls) => ls.warehouseId === targetWarehouse && ls.locationId === targetLoc
          );

          if (existingLocIndex !== -1) {
            locStocks[existingLocIndex] = {
              ...locStocks[existingLocIndex],
              quantity: locStocks[existingLocIndex].quantity + qtyToAdd,
            };
          } else {
            locStocks.push({
              warehouseId: targetWarehouse,
              locationId: targetLoc,
              quantity: qtyToAdd,
            });
          }

          prod.locationStocks = locStocks;
          prod.totalStock = locStocks.reduce((acc, curr) => acc + curr.quantity, 0);
          prod.updatedAt = now;
          updated[prodIndex] = prod;
        }
      });
      return updated;
    });

    // 2. Add StockMoveHistory ledger entries
    const newMoves: StockMoveHistory[] = target.items.map((item) => {
      const qtyToAdd = item.doneQty > 0 ? item.doneQty : item.demandQty;
      return {
        id: `move-${Date.now()}-${item.productId}`,
        timestamp: now,
        referenceNumber: target.referenceNumber,
        operationType: 'receipt',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        fromLocation: `Vendor (${target.supplier})`,
        toLocation: getLocationName(targetLoc),
        quantity: qtyToAdd, // Positive
        unitOfMeasure: item.unitOfMeasure,
        performedBy: user.name,
        notes: `Receipt validated from vendor ${target.supplier}`,
      };
    });

    setMoveHistory((prev) => [...newMoves, ...prev]);

    // 3. Mark receipt done
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'done',
              validatedAt: now,
              validatedBy: user.name,
              items: r.items.map((it) => ({
                ...it,
                doneQty: it.doneQty > 0 ? it.doneQty : it.demandQty,
              })),
            }
          : r
      )
    );

    sound.playSuccess();
  };

  // Delivery Operations
  const createDelivery = (
    data: Omit<DeliveryOrder, 'id' | 'referenceNumber' | 'status' | 'isPicked' | 'isPacked' | 'createdAt'>
  ): DeliveryOrder => {
    const count = deliveries.length + 1;
    const refNum = `DEL-2026-${String(count).padStart(3, '0')}`;
    const newDelivery: DeliveryOrder = {
      ...data,
      id: `del-${Date.now()}`,
      referenceNumber: refNum,
      status: 'draft',
      isPicked: false,
      isPacked: false,
      createdAt: new Date().toISOString(),
    };
    setDeliveries((prev) => [newDelivery, ...prev]);
    sound.playBeep();
    return newDelivery;
  };

  const updateDeliveryPicking = (id: string, isPicked: boolean) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = isPicked ? (d.isPacked ? 'ready' : 'waiting') : 'draft';
          return { ...d, isPicked, status: nextStatus };
        }
        return d;
      })
    );
    sound.playScan();
  };

  const updateDeliveryPacking = (id: string, isPacked: boolean) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = isPacked ? 'ready' : (d.isPicked ? 'waiting' : 'draft');
          return { ...d, isPacked, status: nextStatus };
        }
        return d;
      })
    );
    sound.playBeep();
  };

  const updateDeliveryStatus = (id: string, status: OperationStatus) => {
    setDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    sound.playBeep();
  };

  // PDF Step 3: Validate -> stock decreases automatically!
  const validateDelivery = (id: string) => {
    const target = deliveries.find((d) => d.id === id);
    if (!target || target.status === 'done') return;

    const now = new Date().toISOString();
    const sourceLoc = target.sourceLocationId;
    const sourceWh = target.warehouseId;

    // 1. Decrease product stock from location
    setProducts((prev) => {
      const updated = [...prev];
      target.items.forEach((item) => {
        const prodIndex = updated.findIndex((p) => p.id === item.productId);
        if (prodIndex !== -1) {
          const prod = { ...updated[prodIndex] };
          const qtyToDeduct = item.doneQty > 0 ? item.doneQty : item.demandQty;

          const locStocks = [...prod.locationStocks];
          const existingLocIndex = locStocks.findIndex(
            (ls) => ls.warehouseId === sourceWh && ls.locationId === sourceLoc
          );

          if (existingLocIndex !== -1) {
            const currentQty = locStocks[existingLocIndex].quantity;
            locStocks[existingLocIndex] = {
              ...locStocks[existingLocIndex],
              quantity: Math.max(0, currentQty - qtyToDeduct),
            };
          }

          prod.locationStocks = locStocks;
          prod.totalStock = locStocks.reduce((acc, curr) => acc + curr.quantity, 0);
          prod.updatedAt = now;
          updated[prodIndex] = prod;
        }
      });
      return updated;
    });

    // 2. Add StockMoveHistory ledger entries
    const newMoves: StockMoveHistory[] = target.items.map((item) => {
      const qtyToDeduct = item.doneQty > 0 ? item.doneQty : item.demandQty;
      return {
        id: `move-${Date.now()}-${item.productId}`,
        timestamp: now,
        referenceNumber: target.referenceNumber,
        operationType: 'delivery',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        fromLocation: getLocationName(sourceLoc),
        toLocation: `Customer (${target.customer})`,
        quantity: -qtyToDeduct, // Negative
        unitOfMeasure: item.unitOfMeasure,
        performedBy: user.name,
        notes: `Delivery dispatched to customer ${target.customer}`,
      };
    });

    setMoveHistory((prev) => [...newMoves, ...prev]);

    // 3. Mark delivery done
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'done',
              isPicked: true,
              isPacked: true,
              validatedAt: now,
              validatedBy: user.name,
              items: d.items.map((it) => ({
                ...it,
                doneQty: it.doneQty > 0 ? it.doneQty : it.demandQty,
              })),
            }
          : d
      )
    );

    sound.playSuccess();
  };

  // Internal Transfer Operations
  const createTransfer = (
    data: Omit<InternalTransfer, 'id' | 'referenceNumber' | 'status' | 'createdAt'>
  ): InternalTransfer => {
    const count = transfers.length + 1;
    const refNum = `TRF-2026-${String(count).padStart(3, '0')}`;
    const newTransfer: InternalTransfer = {
      ...data,
      id: `trf-${Date.now()}`,
      referenceNumber: refNum,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setTransfers((prev) => [newTransfer, ...prev]);
    sound.playBeep();
    return newTransfer;
  };

  const updateTransferStatus = (id: string, status: OperationStatus) => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    sound.playBeep();
  };

  // PDF Step 2: Internal transfer: Main Store -> Production Rack. Stock unchanged in total, but new location updated!
  const validateTransfer = (id: string) => {
    const target = transfers.find((t) => t.id === id);
    if (!target || target.status === 'done') return;

    const now = new Date().toISOString();
    const sourceWh = target.sourceWarehouseId;
    const sourceLoc = target.sourceLocationId;
    const destWh = target.destWarehouseId;
    const destLoc = target.destLocationId;

    // 1. Move stock from source location to dest location
    setProducts((prev) => {
      const updated = [...prev];
      target.items.forEach((item) => {
        const prodIndex = updated.findIndex((p) => p.id === item.productId);
        if (prodIndex !== -1) {
          const prod = { ...updated[prodIndex] };
          const qtyToMove = item.doneQty > 0 ? item.doneQty : item.demandQty;

          const locStocks = [...prod.locationStocks];
          
          // Deduct from source location
          const sIndex = locStocks.findIndex(
            (ls) => ls.warehouseId === sourceWh && ls.locationId === sourceLoc
          );
          if (sIndex !== -1) {
            locStocks[sIndex] = {
              ...locStocks[sIndex],
              quantity: Math.max(0, locStocks[sIndex].quantity - qtyToMove),
            };
          }

          // Add to dest location
          const dIndex = locStocks.findIndex(
            (ls) => ls.warehouseId === destWh && ls.locationId === destLoc
          );
          if (dIndex !== -1) {
            locStocks[dIndex] = {
              ...locStocks[dIndex],
              quantity: locStocks[dIndex].quantity + qtyToMove,
            };
          } else {
            locStocks.push({
              warehouseId: destWh,
              locationId: destLoc,
              quantity: qtyToMove,
            });
          }

          prod.locationStocks = locStocks;
          // Total company stock remains unchanged
          prod.totalStock = locStocks.reduce((acc, curr) => acc + curr.quantity, 0);
          prod.updatedAt = now;
          updated[prodIndex] = prod;
        }
      });
      return updated;
    });

    // 2. Add StockMoveHistory ledger entries
    const newMoves: StockMoveHistory[] = target.items.map((item) => {
      const qtyToMove = item.doneQty > 0 ? item.doneQty : item.demandQty;
      return {
        id: `move-${Date.now()}-${item.productId}`,
        timestamp: now,
        referenceNumber: target.referenceNumber,
        operationType: 'internal',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        fromLocation: getLocationName(sourceLoc),
        toLocation: getLocationName(destLoc),
        quantity: qtyToMove,
        unitOfMeasure: item.unitOfMeasure,
        performedBy: user.name,
        notes: target.purpose || `Internal move: ${getLocationName(sourceLoc)} -> ${getLocationName(destLoc)}`,
      };
    });

    setMoveHistory((prev) => [...newMoves, ...prev]);

    // 3. Mark transfer done
    setTransfers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'done',
              validatedAt: now,
              validatedBy: user.name,
              items: t.items.map((it) => ({
                ...it,
                doneQty: it.doneQty > 0 ? it.doneQty : it.demandQty,
              })),
            }
          : t
      )
    );

    sound.playSuccess();
  };

  // Stock Adjustment Operations (PDF Step 4: Fix mismatches between recorded stock & physical count)
  const createAdjustment = (
    data: Omit<StockAdjustment, 'id' | 'referenceNumber' | 'differenceQty' | 'status' | 'createdAt'>
  ): StockAdjustment => {
    const count = adjustments.length + 1;
    const refNum = `ADJ-2026-${String(count).padStart(3, '0')}`;
    const diff = data.countedQty - data.recordedQty;

    const newAdj: StockAdjustment = {
      ...data,
      id: `adj-${Date.now()}`,
      referenceNumber: refNum,
      differenceQty: diff,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    setAdjustments((prev) => [newAdj, ...prev]);
    sound.playBeep();
    return newAdj;
  };

  const validateAdjustment = (id: string) => {
    const target = adjustments.find((a) => a.id === id);
    if (!target || target.status === 'done') return;

    const now = new Date().toISOString();
    const diff = target.countedQty - target.recordedQty;

    // 1. Update product location stock
    setProducts((prev) => {
      const updated = [...prev];
      const prodIndex = updated.findIndex((p) => p.id === target.productId);
      if (prodIndex !== -1) {
        const prod = { ...updated[prodIndex] };
        const locStocks = [...prod.locationStocks];
        const lIndex = locStocks.findIndex(
          (ls) => ls.warehouseId === target.warehouseId && ls.locationId === target.locationId
        );

        if (lIndex !== -1) {
          locStocks[lIndex] = {
            ...locStocks[lIndex],
            quantity: target.countedQty,
          };
        } else {
          locStocks.push({
            warehouseId: target.warehouseId,
            locationId: target.locationId,
            quantity: target.countedQty,
          });
        }

        prod.locationStocks = locStocks;
        prod.totalStock = locStocks.reduce((acc, curr) => acc + curr.quantity, 0);
        prod.updatedAt = now;
        updated[prodIndex] = prod;
      }
      return updated;
    });

    // 2. Add StockMoveHistory ledger entry
    const reasonLabels: Record<string, string> = {
      damaged: 'Damaged Goods Scrapped',
      physical_count: 'Physical Inventory Reconciliation',
      scrap: 'Manufacturing Scrap',
      loss_theft: 'Loss / Unaccounted Variance',
      expired: 'Expired Shelf Life',
      other: 'Stock Adjustment',
    };

    const newMove: StockMoveHistory = {
      id: `move-${Date.now()}`,
      timestamp: now,
      referenceNumber: target.referenceNumber,
      operationType: 'adjustment',
      productId: target.productId,
      productName: target.productName,
      sku: target.sku,
      fromLocation: getLocationName(target.locationId),
      toLocation: `Inventory Adjustment (${reasonLabels[target.reason] || target.reason})`,
      quantity: diff, // e.g. -3 kg
      unitOfMeasure: target.unitOfMeasure,
      performedBy: user.name,
      notes: target.notes || `Stock adjusted from ${target.recordedQty} to ${target.countedQty} (${diff >= 0 ? '+' : ''}${diff} ${target.unitOfMeasure})`,
    };

    setMoveHistory((prev) => [newMove, ...prev]);

    // 3. Mark adjustment done
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'done',
              validatedAt: now,
              validatedBy: user.name,
            }
          : a
      )
    );

    sound.playSuccess();
  };

  // Warehouse Operations
  const addWarehouse = (data: Omit<Warehouse, 'id'>) => {
    const newWh: Warehouse = {
      ...data,
      id: `wh-${Date.now()}`,
    };
    setWarehouses((prev) => [...prev, newWh]);
    sound.playSuccess();
  };

  const addLocationToWarehouse = (
    warehouseId: string,
    locationData: Omit<Warehouse['locations'][0], 'id' | 'warehouseId'>
  ) => {
    setWarehouses((prev) =>
      prev.map((wh) => {
        if (wh.id === warehouseId) {
          const newLoc = {
            ...locationData,
            id: `loc-${Date.now()}`,
            warehouseId,
          };
          return {
            ...wh,
            locations: [...wh.locations, newLoc],
          };
        }
        return wh;
      })
    );
    sound.playBeep();
  };

  // Quick 1-click Reorder triggered from low stock alert
  const triggerQuickReorder = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const defaultWh = warehouses[0];
    const defaultLoc = defaultWh.locations[0];
    const reorderQty = prod.reorderingRule.reorderQuantity || prod.reorderingRule.minQuantity * 2;

    const newReceipt = createReceipt({
      supplier: 'Default Preferred Supplier',
      warehouseId: defaultWh.id,
      destLocationId: defaultLoc.id,
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unitOfMeasure: prod.unitOfMeasure,
          demandQty: reorderQty,
          doneQty: 0,
          destLocationId: defaultLoc.id,
        },
      ],
      notes: `Automated reorder triggered due to low stock threshold (<=${prod.reorderingRule.minQuantity} ${prod.unitOfMeasure})`,
    });

    // Advance to waiting
    updateReceiptStatus(newReceipt.id, 'waiting');
    sound.playSuccess();
  };

  // Reset to initial demo data
  const resetToInitialDemo = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_warehouses`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_products`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_receipts`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_deliveries`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_transfers`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_adjustments`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_moves`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}_user`);

    setWarehouses(INITIAL_WAREHOUSES);
    setProducts(INITIAL_PRODUCTS);
    setReceipts(INITIAL_RECEIPTS);
    setDeliveries(INITIAL_DELIVERIES);
    setTransfers(INITIAL_TRANSFERS);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setMoveHistory(INITIAL_MOVES);
    setUser(INITIAL_USER);
    sound.playSuccess();
  };

  return (
    <InventoryContext.Provider
      value={{
        user,
        setUser,
        role: user.role,
        setRole,
        users,
        activeView,
        setActiveView,
        createStaffAccount,
        updateUserCredentials,
        deleteUserAccount,
        warehouses,
        products,
        receipts,
        deliveries,
        transfers,
        adjustments,
        moveHistory,
        kpis,
        lowStockAlerts,
        soundEnabled,
        setSoundEnabled,
        activeFilters,
        setActiveFilters,
        resetFilters,
        addProduct,
        updateProduct,
        deleteProduct,
        createReceipt,
        updateReceiptStatus,
        validateReceipt,
        createDelivery,
        updateDeliveryPicking,
        updateDeliveryPacking,
        updateDeliveryStatus,
        validateDelivery,
        createTransfer,
        updateTransferStatus,
        validateTransfer,
        createAdjustment,
        validateAdjustment,
        addWarehouse,
        addLocationToWarehouse,
        resetToInitialDemo,
        getLocationName,
        getWarehouseName,
        triggerQuickReorder,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
