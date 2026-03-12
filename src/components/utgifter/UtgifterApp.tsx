import React from "react"
import { useUtgifterState } from "@/hooks/useUtgifterState"
import { UtgifterHeader } from "./UtgifterHeader"
import { PresetBar } from "./PresetBar"
import { KategoriExpense } from "./KategoriExpense"
import { UtgifterBreakdown } from "./UtgifterBreakdown"

export const UtgifterApp: React.FC = () => {
  const { state, hydrated, updateAmount, addItem, removeItem, loadPreset, toggleExpanded } =
    useUtgifterState()

  if (!hydrated) {
    return <div>Laster...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with total */}
      <UtgifterHeader categories={state.categories} />

      {/* Preset buttons */}
      <PresetBar selectedPreset={state.selectedPreset} onPresetSelect={loadPreset} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: Category cards */}
        <div className="space-y-3">
          {state.categories.map((category) => (
            <KategoriExpense
              key={category.id}
              category={category}
              isExpanded={state.expandedCategories.includes(category.id)}
              onToggleExpand={() => toggleExpanded(category.id)}
              onAmountChange={(itemId, amount) => updateAmount(category.id, itemId, amount)}
              onRemoveItem={(itemId) => removeItem(category.id, itemId)}
              onAddItem={(label, amount) => addItem(category.id, label, amount)}
            />
          ))}
        </div>

        {/* Right: Breakdown sidebar */}
        <UtgifterBreakdown categories={state.categories} />
      </div>
    </div>
  )
}
