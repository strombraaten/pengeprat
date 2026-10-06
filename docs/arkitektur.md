# Arkitektur

Hvordan Pengeprat er satt sammen. For *hvorfor*, se [produkt.md](./produkt.md).

## Kort fortalt

- **Astro 5** lager statiske sider. Hvert verktøy er en **React 19-øy** som
  kun kjører i nettleseren (`client:only="react"`).
- **All data ligger i `localStorage`.** Ingen backend, ingen API-kall.
- **Logikken ligger i `src/lib/`** som rene funksjoner med tester.
  Komponentene viser bare og kaller logikken.
- Hostes på Vercel, som bygger `main` automatisk.

## Mappestruktur

```
src/
  pages/            Én .astro-side per verktøy (+ forside og /plan)
  layouts/          app.astro (verktøy, med navigasjon) og main.astro (forside)
  components/
    <verktøy>/      React-komponenter per verktøy
    plan/           Min plan
    ui/             shadcn/ui-komponenter (generert, rør minst mulig)
  hooks/            State per verktøy (use<Verktøy>State) + små hjelpe-hooks
  lib/              Logikk og lagring — her bor reglene
  types/            Typer per verktøy
  test/setup.ts     localStorage i minnet for tester
docs/               Denne dokumentasjonen
```

### `src/lib/` — modulene

| Modul | Ansvar |
|---|---|
| `omraader.ts` | De seks spareområdene: navn, farge, kontotype. **Eneste sted farger og navn defineres.** |
| `beregninger.ts` | Fordelingsreglene: standardfordeling, omfordeling, mål nådd, ny lønn. |
| `plan.ts` | Setter sammen data fra alle verktøy til én plan. Forslaget for uventet sum. |
| `lagring.ts` | Trygg `localStorage` (aldri kast), nøklene, små valideringshjelpere. |
| `<verktøy>-storage.ts` | Innlasting og lagring per verktøy. `tolk<Verktøy>()` validerer og migrerer lagret data. |
| `sikkerhetskopi.ts` | Eksport og import av alle data som JSON. |
| `tall.ts` | Tolking og avrunding av beløp. |
| `formatering.ts` | `formatKr` og tidsformatering. |
| `kategorier.ts` | Postene i Fordeling (tekster, slider-grenser) — bygger på `omraader.ts`. |
| `utgifter-data.ts` | Standardkategorier og utgangspunkt (presets) for Utgifter. |

## Dataflyt

```
 localStorage ──► <verktøy>-storage.ts (tolk + valider) ──► hook (React-state)
      ▲                                                        │
      └──────────── skrivJson ◄── useEffect ved endring ◄───────┘

 Andre verktøys data leses alltid via deres storage-modul, aldri direkte:
   Fordeling   ─ lesUtgifterTotal()          (utgifter-storage)
               ─ lesBekreftedeMål()          (sparemaal-storage)
   Sparemål    ─ loadState()                 (fordeling-storage)
   Plan/Uventet ─ lesPlan()                  (plan.ts leser alle)
```

**Regel:** Et verktøy skal aldri lese en annen nøkkel med `localStorage`
direkte eller parse et annet verktøys JSON selv. Gå via storage-modulen, så
valideringen alltid gjelder.

## Lagring

Nøklene ligger i `NØKLER` i `src/lib/lagring.ts`:

| Nøkkel | Verktøy | Eier |
|---|---|---|
| `pengeprat-utgifter-state` | Månedlige utgifter | `utgifter-storage.ts` |
| `pengeprat_v2` | Fordeling (lønn, poster, faste trekk) | `fordeling-storage.ts` |
| `pengeprat_sparemaal_v1` | Definer taket (mål) | `sparemaal-storage.ts` |
| `pengeprat_uventet_sum` | Uventet sum | `uventet-sum-storage.ts` |
| `theme` | Lys/mørk modus | `ModeToggle.tsx` |

**Endre aldri en nøkkel.** Da mister brukerne dataene sine; det finnes ingen
kopi andre steder.

### Endre formen på lagret data

All innlasting går via en `tolk…()`-funksjon som tåler hva som helst
(`null`, korrupt JSON, gamle formater, feil typer). Slik legger du til et felt:

1. Legg feltet til i typen og i standardverdien.
2. Les det i `tolk…()` med en fallback (`ikkeNegativtTall`, `positivtTallEllerNull`, `tekst` …).
3. Skriv en test i `src/lib/lagring.test.ts` som laster **gammel** data uten feltet.

Eksempler på migreringer som allerede er håndtert:

- **Utgifter:** nye kategorier og poster i koden (som «Diverse») flettes inn
  med 0 kr for eksisterende brukere. `kjenteStandardposter` husker hvilke
  standardposter brukeren har sett, så poster brukeren har slettet ikke
  dukker opp igjen. Det gamle feltet `expandedCategory` migreres.
- **Uventet sum:** det gamle prosentformatet nullstilles.

### Hvorfor `client:only`

Siden alle data ligger i `localStorage`, kan ikke serveren vite hva som skal
vises. Med `client:load` rendret serveren standardvisningen og nettleseren
noe annet, og det ga hydreringsfeil (React #418) og blinking for brukere som
kom tilbake. Med `client:only` rendres verktøyene bare i nettleseren.
Mens de lastes, vises `<Laster>`.

## Kvalitet

```bash
npm run lint       # ESLint (inkl. React-hooks-regler)
npm run typecheck  # astro check (TypeScript)
npm test           # Vitest — logikk og lagring
npm run build      # Astro-bygg
npm run check      # alt over i rekkefølge
```

CI (`.github/workflows/ci.yml`) kjører det samme på hver PR og push til `main`.

### Hva testene dekker

Testene ligger ved siden av modulene (`src/lib/*.test.ts`) og dekker
reglene i [produkt.md](./produkt.md): at summen alltid er lik lønna, mål nådd,
ny lønn, forslaget for uventet sum, tolking av beløp, og at lagret data med
feil form eller gammelt format lastes trygt. Komponentene har ingen tester;
hold dem tynne og legg logikk i `lib/`.

## Vanlige oppgaver

**Legge til et nytt verktøy**

1. `src/pages/<navn>.astro` med `<App client:only="react"><Laster slot="fallback" /></App>`.
2. Komponenter i `src/components/<navn>/`, state i `src/hooks/use<Navn>State.ts`.
3. Lagring: ny nøkkel i `NØKLER`, `src/lib/<navn>-storage.ts` med `tolk…()`.
4. Legg verktøyet i navigasjonen (`layouts/app.astro`) og på forsiden.
5. Skal det inngå i planen? Utvid `byggPlan` i `lib/plan.ts`. Skal det med i
   sikkerhetskopien? Legg det til i `gjenopprett` i `lib/sikkerhetskopi.ts`.

**Endre et spareområde (navn/farge)** — kun i `src/lib/omraader.ts`.

**Endre en regel** — i `src/lib/beregninger.ts` eller `plan.ts`. Oppdater
testen og regelen i [produkt.md](./produkt.md).

## Kjente svakheter

- Komponentene har ingen tester (bare `lib/`). Ende-til-ende-tester
  (Playwright) er et naturlig neste steg.
- Utgifter bruker egne `type="number"`-felt og ikke `parseBeløp`.
