import type { ExpenseCategory } from "@/types/utgifter"

// ═══════════════════════════════════════════════════════════════════════════════
// Calculation Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate total amount for a single category
 */
export function calculateCategoryTotal(category: ExpenseCategory): number {
  return category.items.reduce((sum, item) => sum + (item.amount || 0), 0)
}

/**
 * Calculate grand total across all categories
 */
export function calculateGrandTotal(categories: ExpenseCategory[]): number {
  return categories.reduce((sum, category) => sum + calculateCategoryTotal(category), 0)
}

/**
 * Calculate percentage of an amount relative to total
 */
export function calculatePercentage(amount: number, total: number): number {
  if (total === 0) return 0
  return (amount / total) * 100
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formatting Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format a number as Norwegian currency (kr)
 */
export function formatKr(amount: number): string {
  if (amount === 0) return "0 kr"
  return amount.toLocaleString("no-NO") + " kr"
}

/**
 * Format annual amount
 */
export function formatAnnual(monthlyAmount: number): string {
  return formatKr(monthlyAmount * 12)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category Sorting & Filtering
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get categories with non-zero totals, sorted by amount (descending)
 */
export function getCategoriesWithData(
  categories: ExpenseCategory[],
): Array<ExpenseCategory & { total: number }> {
  return categories
    .map((cat) => ({
      ...cat,
      total: calculateCategoryTotal(cat),
    }))
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total)
}

/**
 * Deep clone of an object (for immutable updates)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}
