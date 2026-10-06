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
  | "Package"

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
  /** true når brukeren har endret tallene (eksempeltallene teller ikke som brukerdata). */
  endret: boolean
  /** Standardposter brukeren har sett — slik at slettede poster ikke dukker opp igjen. */
  kjenteStandardposter: ExpenseItemId[]
}

// ─── Preset Configuration ──────────────────────────────────────────────────────

export type PresetConfig = Record<ExpenseItemId, number>

export type Presets = Record<PresetKey, PresetConfig>
