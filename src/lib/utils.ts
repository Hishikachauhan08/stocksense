import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateReference(prefix: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}-${dateStr}-${random}`
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'validated':
    case 'in stock':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'cancelled':
    case 'out of stock':
      return 'bg-rose-100 text-rose-800 border-rose-300'
    case 'pending':
    case 'low stock':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300'
  }
}
