import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as a currency string
 * @param amount - The amount to format (in cents or dollars)
 * @param isCents - Whether the amount is in cents (default: false)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number | null | undefined, isCents: boolean = false): string {
  if (amount === null || amount === undefined) return ''
  
  // Convert to dollars if amount is in cents
  const value = isCents ? amount / 100 : amount
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
