import { useCallback, useEffect, useState } from "react"
import type { CategoryId, ExpenseItemId, PresetKey, UtgifterState } from "@/types/utgifter"
import { PRESETS } from "@/lib/utgifter-data"
import { lagreUtgifter, lastUtgifter } from "@/lib/utgifter-storage"

/**
 * State for «Månedlige utgifter». Lagring og fletting med kategoriene i
 * koden skjer i lib/utgifter-storage.ts.
 */
export function useUtgifterState() {
  const [state, setState] = useState<UtgifterState>(lastUtgifter)

  useEffect(() => {
    lagreUtgifter(state)
  }, [state])

  const updateAmount = useCallback(
    (categoryId: CategoryId, itemId: ExpenseItemId, amount: number) => {
      setState((prev) => ({
        ...prev,
        endret: true,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map((item) =>
                  item.id === itemId ? { ...item, amount } : item
                ),
              }
            : cat
        ),
      }))
    },
    []
  )

  const addItem = useCallback(
    (categoryId: CategoryId, label: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        endret: true,
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
            : cat
        ),
      }))
    },
    []
  )

  const removeItem = useCallback(
    (categoryId: CategoryId, itemId: ExpenseItemId) => {
      setState((prev) => ({
        ...prev,
        endret: true,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
            : cat
        ),
      }))
    },
    []
  )

  // Utgangspunkt (preset): setter alle standardposter til preset-verdiene
  const loadPreset = useCallback((presetKey: PresetKey) => {
    const preset = PRESETS[presetKey]
    if (!preset) return

    setState((prev) => ({
      ...prev,
      endret: true,
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
    updateAmount,
    addItem,
    removeItem,
    loadPreset,
    toggleExpanded,
  }
}
