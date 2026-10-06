# Pengeprat

Enkle verktøy for personlig økonomi. Astro 5 + React 19, all data i localStorage.

Les før du endrer noe:
- `docs/produkt.md` — prinsippene, flyten mellom stegene og reglene i beregningene
- `docs/arkitektur.md` — mappestruktur, dataflyt, lagring og hvordan man legger til ting

## Viktige regler

- Logikk hører hjemme i `src/lib/` som rene funksjoner med tester. Komponentene skal være tynne.
- Spareområdenes navn og farger defineres kun i `src/lib/omraader.ts`.
- Les og skriv `localStorage` kun via `src/lib/lagring.ts` og `*-storage.ts`. Endre aldri en lagringsnøkkel.
- Nye felt i lagret data: håndter gammel data i `tolk…()` og skriv en test for det.
- Summen av postene i Fordeling skal alltid være lik lønna.
- Kjør `npm run check` (lint, typesjekk, tester, bygg) før du committer.
- Skriv brukerrettet tekst på norsk (bokmål), «du/deg», ikke moraliserende.
