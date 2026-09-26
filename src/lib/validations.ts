import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().min(1, 'Category is required'),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  description: z.string().optional(),
  reorderLevel: z.number().int().min(0).default(0),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
})

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  address: z.string().optional(),
})

export const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
})

export const receiptSchema = z.object({
  destinationId: z.string().min(1, 'Destination location is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
})

export const deliverySchema = z.object({
  sourceId: z.string().min(1, 'Source location is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
})

export const transferSchema = z.object({
  sourceId: z.string().min(1, 'Source location is required'),
  destinationId: z.string().min(1, 'Destination location is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
}).refine((data) => data.sourceId !== data.destinationId, {
  message: 'Source and destination must be different',
  path: ['destinationId'],
})

export const adjustmentSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    physicalQty: z.number().int().min(0, 'Physical quantity cannot be negative'),
  })).min(1, 'At least one item is required'),
})

export const reorderRuleSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  reorderLevel: z.number().int().min(0, 'Reorder level must be non-negative'),
  reorderQty: z.number().int().min(1, 'Reorder quantity must be at least 1'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
