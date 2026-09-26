import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')
const password = z.string().min(6, 'Password must be at least 6 characters').max(128)
const role = z.enum(['inventory_manager', 'warehouse_staff'])
const qty = z.coerce.number().finite().min(0)
const status = z.enum(['draft', 'waiting', 'ready', 'done', 'canceled'])
const date = z.string().trim().min(1, 'Scheduled date is required')

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email,
  password,
  role: role.default('inventory_manager'),
  warehouseId: z.string().optional(),
})

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') })

export const forgotSchema = z.object({ email })
export const verifyOtpSchema = z.object({ email, otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits') })
export const resetSchema = z.object({ resetToken: z.string().min(1), password })

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: email.optional(),
  warehouseId: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: password.optional(),
})

export const staffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  role,
  warehouseId: z.string().min(1),
  temporaryPassword: password.optional(),
})

const reorderingRule = z.object({
  minQuantity: qty,
  maxQuantity: qty,
  reorderQuantity: qty,
  autoReorderEnabled: z.boolean(),
})

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(120),
  sku: z.string().trim().min(1, 'SKU is required').max(40).transform((s) => s.toUpperCase()),
  category: z.string().trim().min(1, 'Category is required').max(60),
  unitOfMeasure: z.string().trim().min(1).max(20),
  price: qty.default(0),
  cost: qty.default(0),
  description: z.string().max(1000).optional(),
  image: z.string().max(2000).optional(),
  reorderingRule: reorderingRule.optional(),
  initialLocationStocks: z
    .array(z.object({ locationId: z.string().min(1), quantity: qty }))
    .optional(),
})

export const productUpdateSchema = productSchema.omit({ initialLocationStocks: true }).partial()

const itemSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  demandQty: z.coerce.number().finite().positive('Quantity must be greater than zero'),
  doneQty: qty.optional(),
})

const items = z.array(itemSchema).min(1, 'Add at least one product')

export const receiptSchema = z.object({
  supplier: z.string().trim().min(1, 'Supplier is required'),
  destLocationId: z.string().min(1, 'Destination location is required'),
  scheduledDate: date,
  items,
  notes: z.string().optional(),
})

export const deliverySchema = z.object({
  customer: z.string().trim().min(1, 'Customer is required'),
  sourceLocationId: z.string().min(1, 'Source location is required'),
  scheduledDate: date,
  shippingAddress: z.string().optional(),
  items,
  notes: z.string().optional(),
})

export const transferSchema = z
  .object({
    sourceLocationId: z.string().min(1, 'Source location is required'),
    destLocationId: z.string().min(1, 'Destination location is required'),
    scheduledDate: date,
    items,
    purpose: z.string().optional(),
  })
  .refine((t) => t.sourceLocationId !== t.destLocationId, {
    message: 'Source and destination must be different locations',
    path: ['destLocationId'],
  })

export const operationPatchSchema = z.object({
  status: status.exclude(['done']).optional(),
  isPicked: z.boolean().optional(),
  isPacked: z.boolean().optional(),
})

export const adjustmentSchema = z.object({
  locationId: z.string().min(1),
  productId: z.string().min(1),
  countedQty: qty,
  reason: z.enum(['damaged', 'physical_count', 'scrap', 'loss_theft', 'expired', 'other']),
  notes: z.string().optional(),
  validate: z.boolean().optional(),
})

const locationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(60),
  code: z.string().trim().min(1).max(40).transform((s) => s.toUpperCase()),
  type: z.enum(['shelf', 'rack', 'floor', 'transit', 'dock']).default('rack'),
  capacity: z.coerce.number().int().min(0).default(500),
})
export { locationSchema }

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required').max(80),
  code: z.string().trim().min(1, 'Warehouse code is required').max(20).transform((s) => s.toUpperCase()),
  address: z.string().max(200).default(''),
  manager: z.string().max(80).default(''),
  locations: z.array(locationSchema).optional(),
})
