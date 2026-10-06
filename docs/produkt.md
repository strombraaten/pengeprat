# Produktlogikken i Pengeprat

Dette dokumentet forklarer **hvorfor** Pengeprat fungerer som det gjør: hvilke
prinsipper verktøyene bygger på, hvordan stegene henger sammen, og hvilke
regler beregningene følger. Hvordan det er bygget teknisk står i
[arkitektur.md](./arkitektur.md).

> Erstatter [documentation/sparekalkulator_spec.md](../documentation/sparekalkulator_spec.md)
> som gjeldende beskrivelse. Spesifikasjonen er beholdt som historikk.

## Målet

Folk vil ikke bli rike, de vil slippe å tenke på penger. Pengeprat gir den
følelsen ved å hjelpe deg til en **plan**: hva som skal gå til hva hver måned,
hvor mye som er nok for hvert mål, og når du er i mål.

## Prinsippene

Dette er rammeverket alt annet bygger på. Når vi er i tvil om en løsning, er
det disse vi sjekker mot.

| Prinsipp | Hva det betyr i praksis |
|---|---|
| **De seks spareområdene** | Buffer, guilt-free, ferie, store livshendelser, framtidsfri og pensjon (pluss faste utgifter). Alle verktøy bruker de samme områdene, med samme navn og farge. |
| **Lokalt først** | Ingen innlogging, ingen backend, ingen sporing. Alt ligger i nettleseren. Derfor må lagringen være robust, og brukeren må kunne ta sikkerhetskopi. |
| **Tilpass, ikke forskriv** | Vi foreslår, brukeren bestemmer. Data fra ett steg *foreslås* i det neste; det overskriver aldri noe brukeren har valgt. |
| **Kronebeløp, ikke prosenter** | Vis alltid kroner. Runde tall (50/100 kr) på alt brukeren skal sette opp som trekk. |
| **Bufferen først** | Buffer er grunnmuren. Den fylles først når det kommer uventede penger. |
| **Mål har et tak** | De fleste sparemål har en øvre grense. Når den er nådd, går pengene videre til andre mål. |
| **Empatisk språk** | «Du/deg», aldri moraliserende. Guilt-free spending er bærekraft, ikke grådighet. |

## Spareområdene

Definert én gang i `src/lib/omraader.ts`.

| Område | Hva | Konto | Har tak? |
|---|---|---|---|
| Faste utgifter | Husleie/lån, strøm, mat, transport, abonnementer | brukskonto | — |
| Buffer | Nødfond for uventede utgifter | sparekonto | Ja: 1,5 × månedslønn |
| Guilt-free spending | Penger du bruker uten dårlig samvittighet | forbrukskonto | Nei |
| Ferie | Spares jevnlig, brukes fortløpende, fylles på igjen | sparekonto | Ja: 15 000 kr |
| Store livshendelser | Bil, bryllup, egenkapital … | sparekonto | Ja: brukeren setter |
| Framtidsfri | Friheten til å si nei, bytte jobb, ta en pause | aksjesparekonto | Ja: 6 × faste utgifter |
| Pensjon | Langsiktig, ikke rør før pensjonsalder | IPS / pensjonskonto | Avhenger av mye — vi lenker til kalkulator |

**Åpent spørsmål:** Framtidsfri er et sparemål i «Definer taket» og en
kategori i «Uventet sum», men ikke en egen post i Fordeling. Skal den inn der,
må standardandelene (`STANDARD_PROSENT`) justeres.

## Stegene og planen

Verktøyene er steg i én samtale med deg selv. Hvert steg bygger på det forrige,
og resultatet samles i **Min plan**.

```
 1. Månedlige utgifter ──► faste utgifter ──┐
                                            ▼
 2. Fordeling ◄── lønn ── forslag ── mål ◄── 4. Definer taket
        │                                     ▲
        ├──► 3. Faste trekk (huk av)          │ lønn og faste utgifter
        │                                     │ gir forslag til mål
        └─────────────────────────────────────┘
                         │
                         ▼
                     Min plan ──► utskrift / sikkerhetskopi
                         │
                         ▼
                  Uventet sum (forslag ut fra hva som mangler på målene)
```

### Hva flyter mellom stegene

| Fra | Til | Hva | Hvordan |
|---|---|---|---|
| Utgifter | Fordeling | Totalen blir faste utgifter | **Foreslås** ved oppstart (avkrysning, på som standard) og som «Bruk X kr» i oversikten hvis tallene avviker. Eksempeltallene i Utgifter teller ikke før brukeren har endret noe. |
| Fordeling | Definer taket | Lønn → buffer-forslag. Faste utgifter → framtidsfri-forslag | Brukes som forslag og for «Tilbakestill til forslag». |
| Definer taket ↔ Fordeling | begge veier | Mål for buffer, ferie og store livshendelser | **Definer taket eier målene.** Bekreftede mål der går foran. Endrer du et mål i Fordeling, lagres det som bekreftet mål i Definer taket. |
| Fordeling | Min plan | Månedlige trekk, «allerede spart», tid til mål | Planen leser alt (se `lib/plan.ts`). |
| Alle | Uventet sum | Hvor mye som mangler på hvert mål | Knappen «Foreslå fordeling». |

## Reglene i beregningene

Alt ligger i `src/lib/beregninger.ts` og er dekket av tester.

### Forslaget til fordeling

- Standardandeler av lønna: faste utgifter 75 %, buffer 6,6 %, guilt-free 5,9 %,
  ferie 5,4 %, store livshendelser 4,1 %, pensjon 3,0 %.
- Har brukeren fylt ut Utgifter, brukes den summen som faste utgifter, og
  sparepostene skaleres til å fylle resten.
- Spareposter rundes til nærmeste 50 kr.

### Summen er alltid lik lønna

Uansett hva brukeren gjør, skal alle postene til sammen være lik lønna.

- **Slider på en sparepost:** differansen fordeles likt på de andre
  sparepostene. Faste utgifter røres aldri av en slider, og posten brukeren
  drar i, blir stående der den slippes.
- **Faste utgifter endres:** sparepostene skaleres proporsjonalt.
- **Avrundingskroner** havner i guilt-free («restposten»), slik at
  sparetrekkene forblir runde tall. Faste utgifter avrundes aldri; det er
  et reelt beløp.

### Mål nådd

Når «allerede spart» ≥ mål, trenger posten ikke flere penger. Månedsbeløpet
settes til 0 og fordeles likt på de andre sparepostene som ikke har nådd målet
sitt. Har alle nådd målet, går pengene til guilt-free.

### Ny lønn

Endres lønna fra oversikten, beholder vi det brukeren har bestemt:

- Faste utgifter beholdes hvis brukeren har satt dem selv (og de er lavere
  enn ny lønn); ellers brukes standardandelen.
- Sparepostene skaleres proporsjonalt, så den relative fordelingen beholdes.
- Mål og «allerede spart» røres ikke. Unntak: buffer-målet følger lønna så
  lenge det er vårt forslag og ikke et mål brukeren har bekreftet.

### Uventet sum: forslaget

Knappen «Foreslå fordeling» (`foreslåUventetFordeling` i `lib/plan.ts`):

1. Fyll opp bufferen først (mål minus allerede spart).
2. Av resten går 30 % til guilt-free. Du skal få kose deg litt.
3. Resten fyller målene i rekkefølge: ferie, store livshendelser, framtidsfri.
4. Det som er igjen, går til pensjon.

Beløpene rundes ned til hele hundrelapper, og hele summen fordeles alltid.
Brukeren kan justere alt etterpå. Forslaget vises med en kort begrunnelse.

### Tolking av beløp

`parseBeløp` i `src/lib/tall.ts` godtar «35000», «35 000», «35.000»,
«35 000 kr» og «35 000,50». Komma eller punktum fulgt av nøyaktig tre sifre
er tusenskille; ellers er det desimalskille. Desimaler rundes til hele kroner.

## Min plan

`/plan` samler resultatet:

- **Stegene** med status og «Gjør nå» på neste steg som ikke er gjort.
- **Hver måned:** lønn, faste utgifter og hvert trekk med kontotype.
- **Sparemålene:** mål, hvor mye som er spart, og hvilken måned du er i mål.
  Mål som ikke er bekreftet i Definer taket, merkes «forslag».
- **Ta vare på planen:** skriv ut, eller last ned/hent inn sikkerhetskopi
  (JSON-fil som aldri sendes noe sted).
