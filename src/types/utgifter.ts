// ═══════════════════════════════════════════════════════════════════════════════
// Utgifter (Monthly Expenses) Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type ExpenseItemId = string
export type CategoryId = string
export type PresetKey = "student" | "singel" | "par" | "familie" | "snartpensjonist" | "pensjonist"
export type PhosphorIconName =
  | "House"
  | "CreditCard"
  | "Car"
  | "Phone"
  | "Shield"
  | "ShoppingCart"
  | "Smiley"
  | "Baby"

// ─── Expense Item ──────────────────────────────────────────────────────────────

export interface ExpenseItem {
  id: ExpenseItemId
  label: string
  amount: number
  custom?: boolean
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface ExpenseCategory {
  id: CategoryId
  name: string
  icon: PhosphorIconName
  items: ExpenseItem[]
}

// ─── State ────────────────────────────────────────────────────────────────────

export interface UtgifterState {
  categories: ExpenseCategory[]
  expandedCategories: CategoryId[]
  selectedPreset: PresetKey | null
}

// ─── Context value (passed to components via props) ──────────────────────────

export interface UtgifterContextValue extends UtgifterState {
  updateAmount: (categoryId: CategoryId, itemId: ExpenseItemId, amount: number) => void
  addItem: (categoryId: CategoryId, label: string, amount: number) => void
  removeItem: (categoryId: CategoryId, itemId: ExpenseItemId) => void
  loadPreset: (presetKey: PresetKey) => void
  toggleExpanded: (categoryId: CategoryId) => void
}

// Legacy state shape (pre-migration)
export interface LegacyUtgifterState {
  categories: ExpenseCategory[]
  expandedCategory?: CategoryId | null
  expandedCategories?: CategoryId[]
  selectedPreset: PresetKey | null
}

// ─── Preset Configuration ──────────────────────────────────────────────────────

export type PresetConfig = Record<ExpenseItemId, number>

export interface Presets {
  [key in PresetKey]: PresetConfig
}
