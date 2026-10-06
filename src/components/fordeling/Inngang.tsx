import { useState } from "react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { parseBeløp } from "@/lib/tall"
import { formatKr } from "@/lib/formatering"
import { lesUtgifterTotal } from "@/lib/utgifter-storage"

interface InngangProps {
  onStart: (lønn: number, fasteFraUtgifter: number | null) => void
}

export function Inngang({ onStart }: InngangProps) {
  const [verdi, setVerdi] = useState("")
  // Har brukeren fylt ut Månedlige utgifter, foreslår vi å bruke summen derfra
  const [utgifterTotal] = useState(lesUtgifterTotal)
  const [brukUtgifter, setBrukUtgifter] = useState(true)

  const parsed = parseBeløp(verdi)
  const gyldig = parsed !== null && parsed >= 1000
  const utgifterPasser = utgifterTotal != null && parsed != null && utgifterTotal < parsed

  function handleSubmit() {
    if (gyldig && parsed) {
      onStart(parsed, brukUtgifter && utgifterPasser ? utgifterTotal : null)
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Fordeling</CardTitle>
          <CardDescription>
            Økonomisk frihet handler om kontroll.
            Få en plan på under 5 minutter.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="lønn-input" className="text-sm font-medium">
              Månedslønn etter skatt
            </label>
            <div className="relative">
              <Input
                id="lønn-input"
                type="text"
                inputMode="numeric"
                placeholder="f.eks. 35 000"
                autoComplete="off"
                value={verdi}
                onChange={(e) => setVerdi(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && gyldig) handleSubmit()
                }}
                className="pr-10"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                kr
              </span>
            </div>
          </div>

          {utgifterTotal != null && (
            <label className="flex items-start gap-3 rounded-md bg-muted/50 px-3 py-2.5 text-sm cursor-pointer">
              <Checkbox
                checked={brukUtgifter}
                onCheckedChange={(v) => setBrukUtgifter(v === true)}
                className="mt-0.5"
              />
              <span className="text-muted-foreground leading-relaxed">
                Bruk <strong className="text-foreground">{formatKr(utgifterTotal)}</strong>{" "}
                fra Månedlige utgifter som faste utgifter
                {parsed != null && !utgifterPasser && gyldig && (
                  <span className="block text-xs mt-1">
                    Utgiftene er høyere enn lønna, så vi bruker et anslag i stedet.
                  </span>
                )}
              </span>
            </label>
          )}

          <Button onClick={handleSubmit} disabled={!gyldig} className="w-full">
            Lag plan <ArrowRightIcon data-icon="inline-end" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Vi lagrer planen din lokalt i nettleseren din. Ingen data sendes til
            noen server.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
