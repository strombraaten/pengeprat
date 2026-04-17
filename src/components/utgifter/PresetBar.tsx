import type React from "react"
import { Button } from "@/components/ui/button"
import { PRESET_LABELS } from "@/lib/utgifter-data"
import type { PresetKey } from "@/types/utgifter"

interface PresetBarProps {
  selectedPreset: PresetKey | null
  onPresetSelect: (preset: PresetKey) => void
}

const PRESET_KEYS: PresetKey[] = ["student", "singel", "par", "familie", "snartpensjonist", "pensjonist"]

export const PresetBar: React.FC<PresetBarProps> = ({ selectedPreset, onPresetSelect }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-medium text-muted-foreground">Utgangspunkt:</label>
      <div className="flex flex-wrap gap-2">
        {PRESET_KEYS.map((preset) => (
          <Button
            key={preset}
            variant={selectedPreset === preset ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetSelect(preset)}
            className="rounded-full"
          >
            {PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>
    </div>
  )
}
