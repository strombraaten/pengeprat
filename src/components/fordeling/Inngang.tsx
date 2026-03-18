import { useState } from "react"
import { ArrowRightIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface InngangProps {
  onStart: (lønn: number) => void
}

function parseNummer(str: string): number | null {
  const renset = str.replace(/\s/g, "").replace(/,/g, "")
  const tall = parseInt(renset, 10)
  return isNaN(tall) ? null : tall
}

export function Inngang({ onStart }: InngangProps) {
  const [verdi, setVerdi] = useState("")
  const parsed = parseNummer(verdi)
  const gyldig = parsed !== null && parsed >= 1000

  function handleSubmit() {
    if (gyldig && parsed) onStart(parsed)
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
                pattern="[0-9]*"
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
