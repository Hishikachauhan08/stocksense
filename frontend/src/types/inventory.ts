export type Role = 'inventory_manager' | 'warehouse_staff';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  warehouseId: string; // assigned warehouse
  password?: string;
  createdBy?: string;  // e.g. "Inventory Manager"
  mustChangePassword?: boolean;
  createdAt?: string;
}

export type UnitOfMeasure = 'kg' | 'units' | 'pcs' | 'boxes' | 'meters' | 'liters' | 'pallets';

export type ProductCategory = 
  | 'Raw Materials'
  | 'Finished Goods'
  | 'Metals & Steel'
  | 'Furniture'
  | 'Hardware'
  | 'Electronics'
  | 'Packaging';

export interface ProductLocationStock {
  warehouseId: string;
  locationId: string;
  quantity: number;
}

export interface ReorderingRule {
  minQuantity: number;
  maxQuantity: number;
  reorderQuantity: number;
  autoReorderEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory | string;
  unitOfMeasure: UnitOfMeasure | string;
  price: number;
  cost: number;
  description?: string;
  image?: string;
  totalStock: number;
  locationStocks: ProductLocationStock[];
  reorderingRule: ReorderingRule;
  createdAt: string;
  updatedAt: string;
}

export type OperationType = 'receipt' | 'delivery' | 'internal' | 'adjustment';

export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

export interface OperationItem {
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  demandQty: number;      // Ordered or scheduled quantity
  doneQty: number;        // Actually received, picked, or counted quantity
  sourceLocationId?: string;
  destLocationId?: string;
}

export interface Receipt {
  id: string;
  referenceNumber: string; // e.g. REC-2026-001
  supplier: string;
  warehouseId: string;
  destLocationId: string;
  scheduledDate: string;
  status: OperationStatus;
  items: OperationItem[];
  notes?: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface DeliveryOrder {
  id: string;
  referenceNumber: string; // e.g. DEL-2026-001
  customer: string;
  warehouseId: string;
  sourceLocationId: string;
  scheduledDate: string;
  status: OperationStatus;
  isPicked: boolean;
  isPacked: boolean;
  items: OperationItem[];
  shippingAddress?: string;
  notes?: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface InternalTransfer {
  id: string;
  referenceNumber: string; // e.g. TRF-2026-001
  sourceWarehouseId: string;
  sourceLocationId: string;
  destWarehouseId: string;
  destLocationId: string;
  scheduledDate: string;
  status: OperationStatus;
  items: OperationItem[];
  purpose?: string;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export type AdjustmentReason = 
  | 'damaged'
  | 'physical_count'
  | 'scrap'
  | 'loss_theft'
  | 'expired'
  | 'other';

export interface StockAdjustment {
  id: string;
  referenceNumber: string; // e.g. ADJ-2026-001
  warehouseId: string;
  locationId: string;
  productId: string;
  productName: string;
  sku: string;
  unitOfMeasure: string;
  recordedQty: number;
  countedQty: number;
  differenceQty: number;
  reason: AdjustmentReason;
  notes?: string;
  status: OperationStatus;
  createdAt: string;
  validatedAt?: string;
  validatedBy?: string;
}

export interface StockMoveHistory {
  id: string;
  timestamp: string;
  referenceNumber: string;
  operationType: OperationType;
  productId: string;
  productName: string;
  sku: string;
  fromLocation: string; // e.g. "Vendor", "Main Store - Rack A"
  toLocation: string;   // e.g. "Main Store - Rack A", "Customer"
  quantity: number;     // positive or negative or transfer amount
  unitOfMeasure: string;
  performedBy: string;
  notes?: string;
}

export interface LocationZone {
  id: string;
  name: string;         // e.g. "Rack A", "Rack B", "Production Rack", "Shipping Bay"
  warehouseId: string;
  code: string;         // e.g. "WH1-RACK-A"
  type: 'shelf' | 'rack' | 'floor' | 'transit' | 'dock';
  capacity: number;     // max items
}

export interface Warehouse {
  id: string;
  name: string;         // e.g. "Main Store", "Production Floor", "Warehouse 2"
  code: string;         // e.g. "WH-MAIN", "WH-PROD", "WH-02"
  address: string;
  manager: string;
  locations: LocationZone[];
}

export interface DashboardKPIs {
  totalProductsCount: number;
  totalUnitsInStock: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  internalTransfersScheduledCount: number;
  totalInventoryValuation: number;
}

export interface FilterOptions {
  documentType: 'all' | OperationType;
  status: 'all' | OperationStatus;
  warehouseId: 'all' | string;
  category: 'all' | string;
  searchQuery: string;
}

export interface LowStockAlert {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  minQuantity: number;
  recommendedReorder: number;
  unitOfMeasure: string;
}
