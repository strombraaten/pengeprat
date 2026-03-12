import { useCallback, useEffect, useState } from "react"
import type { CategoryId, ExpenseItemId, LegacyUtgifterState, PresetKey, UtgifterState } from "@/types/utgifter"
import { DEFAULT_CATEGORIES, PRESETS } from "@/lib/utgifter-data"
import { deepClone } from "@/lib/utgifter-utils"

const STORAGE_KEY = "pengeprat-utgifter-state"

function loadInitialState(): UtgifterState {
  const allCategoryIds = DEFAULT_CATEGORIES.map((c) => c.id)
  const defaults: UtgifterState = {
    categories: deepClone(DEFAULT_CATEGORIES),
    expandedCategories: allCategoryIds,
    selectedPreset: null,
  }
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return defaults
  try {
    const parsed = JSON.parse(saved) as LegacyUtgifterState
    // Migrate from old single-expanded format
    const expandedCategories =
      parsed.expandedCategories ?? (parsed.expandedCategory ? [parsed.expandedCategory] : allCategoryIds)
    return { ...parsed, expandedCategories }
  } catch (e) {
    console.error("Failed to load utgifter state:", e)
    return defaults
  }
}

/**
 * Custom hook for managing "Månedlige utgifter" state
 * Handles categories, items, amounts, and localStorage persistence
 */
export function useUtgifterState() {
  const [state, setState] = useState<UtgifterState>(loadInitialState)

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // ─────────────────────────────────────────────────────────────────────────────
  // Update an expense item amount
  // ─────────────────────────────────────────────────────────────────────────────

  const updateAmount = useCallback(
    (categoryId: CategoryId, itemId: ExpenseItemId, amount: number) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId ? { ...item, amount } : item,
                ),
              }
            : cat,
        ),
      }))
    },
    [],
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // Add a custom item to a category
  // ─────────────────────────────────────────────────────────────────────────────

  const addItem = useCallback(
    (categoryId: CategoryId, label: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: [
                  ...cat.items,
                  {
                    id: `custom-${Date.now()}`,
                    label: label.trim(),
                    amount,
                    custom: true,
                  },
                ],
              }
            : cat,
        ),
      }))
    },
    [],
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // Remove an item from a category
  // ─────────────────────────────────────────────────────────────────────────────

  const removeItem = useCallback(
    (categoryId: CategoryId, itemId: ExpenseItemId) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.filter((item) => item.id !== itemId),
              }
            : cat,
        ),
      }))
    },
    [],
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // Load a preset scenario (resets all items to preset values)
  // ─────────────────────────────────────────────────────────────────────────────

  const loadPreset = useCallback((presetKey: PresetKey) => {
    const preset = PRESETS[presetKey]
    if (!preset) return

    setState((prev) => ({
      ...prev,
      selectedPreset: presetKey,
      categories: prev.categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          amount: preset[item.id] ?? 0,
          custom: false,
        })),
      })),
    }))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Toggle category expanded/collapsed state
  // ─────────────────────────────────────────────────────────────────────────────

  const toggleExpanded = useCallback((categoryId: CategoryId) => {
    setState((prev) => ({
      ...prev,
      expandedCategories: prev.expandedCategories.includes(categoryId)
        ? prev.expandedCategories.filter((id) => id !== categoryId)
        : [...prev.expandedCategories, categoryId],
    }))
  }, [])

  return {
    state,
    hydrated: true,
    updateAmount,
    addItem,
    removeItem,
    loadPreset,
    toggleExpanded,
  }
}
