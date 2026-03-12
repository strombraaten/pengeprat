import { Button } from "@/components/ui/button"

interface FeiringProps {
  onTilbakeTilPlan: () => void
}

export function Feiring({ onTilbakeTilPlan }: FeiringProps) {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">

        <div className="space-y-2">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold tracking-tight">Du er god!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Å sette opp automatiske trekk er en av de viktigste tingene du kan
            gjøre for sparingen din. Nå skjer det av seg selv — uten at du
            trenger å tenke på det.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-left space-y-2 shadow-sm">
          <h3 className="font-semibold text-sm">Vil du spare mer?</h3>
          <p className="text-sm text-muted-foreground">
            Test ut planen din en måned først, og se over de faste utgiftene
            dine om det er noe du kan kutte ut eller justere på. Det er bedre
            å starte litt rolig enn for aggressivt.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onTilbakeTilPlan}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Tilbake til planen
          </button>
          <Button asChild className="w-full">
            <a href="/">Gå til alle verktøyene</a>
          </Button>
        </div>

      </div>
    </div>
  )
}
