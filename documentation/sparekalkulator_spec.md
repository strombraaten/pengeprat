# Pengeprat – Sparekalkulator: Implementeringsdokument for Claude Code

## Kontekst
Dette dokumentet beskriver funksjonalitet og struktur for Pengeprat-sparekalkulatoren som bygges som en ren HTML/CSS-applikasjon uten rammeverk. Prosjektet bruker et mørkt tema og monospace-typografi, og all logikk håndteres med vanilla JavaScript direkte i nettleseren.

---

## 1. Overordnet konsept

### Formål
Gi brukere økonomisk kontroll ved å:
- Raskt få en oversikt over hvordan månedslønnen kan fordeles
- Forstå *hvorfor* hver post er viktig
- Tilpasse planen til egen situasjon
- Få konkrete tall å sette opp som faste trekk

### Designprinsipper
- **Lokal først**: Alt skjer i nettleseren, ingen backend
- **Runde tall**: Alle beløp avrundet til nærmeste 50/100 kr
- **Transparens**: Vis alltid kronebeløp, ikke bare prosenter
- **Empatisk språk**: "Du/deg", ikke moraliserende
- **Ingen dårlige valg**: Tilpass, ikke forskriv

---

## 2. Datamodell

### State-struktur
```javascript
const state = {
  lønn: null, // number
  
  poster: {
    fasteUtgifter: {
      månedlig: null,
      standardProsent: 65,
      redigerbar: true,
      harMål: false,
      type: 'utgift'
    },
    
    buffer: {
      månedlig: null,
      standardProsent: 9.2,
      mål: null, // beregnes: lønn * 1.5
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing',
      takBeskrivelse: '1,5× månedslønn (kan justeres til 3× for usikre jobber)'
    },
    
    guiltFree: {
      månedlig: null,
      standardProsent: 8.3,
      anbefaltMin: null, // beregnes: lønn * 0.07
      anbefaltMaks: null, // beregnes: lønn * 0.12
      redigerbar: true,
      harMål: false,
      type: 'løpende'
    },
    
    ferie: {
      månedlig: null,
      standardProsent: 7.5,
      mål: 15000, // fast
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing',
      takBeskrivelse: '15 000 kr dekker en god ferie for de fleste'
    },
    
    storeLivshendelser: {
      månedlig: null,
      standardProsent: 5.8,
      mål: null, // brukerdefinert
      valgteMål: [], // array: ['bryllup', 'barn', 'bil', ...]
      målBeløp: {}, // { bryllup: 150000, barn: 30000, ... }
      alleredeSpart: 0,
      redigerbar: true,
      harMål: true,
      type: 'sparing'
    },
    
    pensjon: {
      månedlig: null,
      standardProsent: 4.2,
      årligMaks: 15000, // skattefradrag IPS
      redigerbar: true,
      harMål: false,
      type: 'løpende'
    },

    // Vises kun hvis bruker oppgir kredittkortgjeld (fase 2)
    kredittkortgjeld: {
      månedlig: 0,
      beløp: 0,           // total gjeld
      harGjeld: null,     // null | true | false – null = ikke spurt ennå
      aktiv: false,       // true hvis posten er synlig i oversikt
      redigerbar: true,
      harMål: true,       // målet er beløp === 0
      type: 'gjeld'
    }
  },

  interaksjon: {
    // Track hvilke poster bruker har åpnet/justert
    fasteUtgifter: false,
    buffer: false,
    guiltFree: false,
    ferie: false,
    storeLivshendelser: false,
    pensjon: false,
    kredittkortgjeld: false
  }
};
```

---

## 3. Standardfordeling (eksempel: 30 000 kr)

Når bruker taster inn lønn, beregnes standardverdier:

```
Månedslønn: 30 000 kr

Faste utgifter        19 500 kr  (65%)
Buffer                 2 750 kr  (9.2%)
Guilt-free spending    2 500 kr  (8.3%)
Ferie                  2 250 kr  (7.5%)
Store livshendelser    1 750 kr  (5.8%)
Pensjon                1 250 kr  (4.2%)
                       -------
Total:                30 000 kr  (100%)
```

### Beregningslogikk
```javascript
function beregnStandardfordeling(lønn) {
  // Beregn hver post
  const fasteUtgifter = Math.round(lønn * 0.65 / 100) * 100;
  const buffer = Math.round(lønn * 0.092 / 50) * 50;
  const guiltFree = Math.round(lønn * 0.083 / 50) * 50;
  const ferie = Math.round(lønn * 0.075 / 50) * 50;
  const storeLivshendelser = Math.round(lønn * 0.058 / 50) * 50;
  const pensjon = Math.round(lønn * 0.042 / 50) * 50;
  
  // Sjekk total
  const total = fasteUtgifter + buffer + guiltFree + ferie + storeLivshendelser + pensjon;
  
  // Hvis ikke 100%, juster største post (faste utgifter)
  const differanse = lønn - total;
  return {
    fasteUtgifter: fasteUtgifter + differanse,
    buffer,
    guiltFree,
    ferie,
    storeLivshendelser,
    pensjon
  };
}

function beregnBufferMål(lønn) {
  return lønn * 1.5;
}

function beregnGuiltFreeRange(lønn) {
  return {
    min: Math.round(lønn * 0.07 / 50) * 50,
    maks: Math.round(lønn * 0.12 / 50) * 50
  };
}
```

---

## 4. Sidestruktur og navigasjon

### Sider
1. **Inngangsside** (`/` eller `/sparekalkulator`)
2. **Kredittkortgjeld-modal** (overlay etter lønn-input)
3. **Oversikt** (alle poster som klikkbare kort)
4. **Detaljsider** (én per post, med breadcrumb)
5. **Oppsummering** (ferdig plan)

### Routing
Bruk JavaScript-basert view-switching der alle «sider» er `<section>`-elementer i én HTML-fil. Aktiv visning styres ved å sette/fjerne CSS-klasser. Kall `visView` direkte med seksjonens ID – ingen separat routes-tabell er nødvendig.

```javascript
// Cache view-elementer én gang ved oppstart
const viewElements = document.querySelectorAll('.view');

function visView(navn) {
  const mål = document.getElementById(navn);
  if (!mål) {
    console.warn(`visView: fant ikke view med id "${navn}"`);
    return;
  }
  viewElements.forEach(el => el.classList.remove('aktiv'));
  mål.classList.add('aktiv');
}

// Eksempel på bruk:
// visView('inngang')
// visView('oversikt')
// visView('detaljBuffer')
// visView('oppsummering')
```

### Navigasjonsflyt
```
Inngangsside (input lønn)
    ↓
Kredittkortgjeld-modal (overlay)
    ↓ (ja/nei)
Oversikt (6 poster som kort)
    ↓ (klikk på post)
Detaljside (med breadcrumb: ← Oversikt)
    ↓ (juster, input allerede spart)
    ↓ (klikk breadcrumb)
Oversikt (oppdatert)
    ↓ (klikk "Se oppsummering")
Oppsummering (ferdig plan)
    ↓ (start på nytt)
Inngangsside
```

---

## 5. Sidevisninger og komponenter

### 5.1 Inngangsside

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         PENGEPRAT                       │
│         Sparekalkulator                 │
│                                         │
│  Økonomisk frihet handler om kontroll.  │
│  Få en plan på 5 minutter.              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Månedslønn etter skatt            │  │
│  │ [_____________] kr                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Start →]                              │
│                                         │
└─────────────────────────────────────────┘
```

**HTML for lønn-input:**
```html
<!-- Bruk type="text" + inputmode for bedre mobilopplevelse.
     type="number" har quirks: scroll-hjulet endrer verdien,
     og det støtter ikke norske tusenskillere. -->
<input
  id="lønn-input"
  type="text"
  inputmode="numeric"
  pattern="[0-9]*"
  placeholder="f.eks. 35000"
  autocomplete="off"
>
```

**Funksjonalitet:**
- Input-felt: kun tall, min 1000 kr
- "Start"-knapp aktiveres når gyldig tall er tastet
- Ved klikk: Beregn standardfordeling → vis kredittkortgjeld-modal

---

### 5.2 Kredittkortgjeld-modal

**Timing:** Vises som overlay rett etter lønn-input (før oversikt)

**Implementering:** Bruk det native `<dialog>`-elementet – gir gratis Escape-håndtering, innebygd `::backdrop` for overlay, og korrekt fokus-fangst uten ekstra JavaScript.

```html
<dialog id="gjeld-modal">
  <!-- innhold her -->
</dialog>
```

```javascript
// Åpne
document.getElementById('gjeld-modal').showModal();

// Lukke
document.getElementById('gjeld-modal').close();
```

**Layout (første spørsmål):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  💳 Før vi fortsetter...                                │
│                                                         │
│  Har du kredittkortgjeld?                              │
│                                                         │
│  Kredittkortgjeld har vanligvis svært høy rente         │
│  (15-25%), så det bør alltid prioriteres først.        │
│                                                         │
│  [Ja, jeg har kredittkortgjeld]                        │
│  [Nei, jeg har ingen kredittkortgjeld]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Hvis "Ja":**
```
┌─────────────────────────────────────────────────────────┐
│  Hvor mye kredittkortgjeld har du?                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [_____________] kr                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Med din nåværende plan kan du bruke disse postene    │
│  til å betale ned gjelden:                            │
│                                                         │
│  Buffer:              2 750 kr/mnd                     │
│  Store livshendelser: 1 750 kr/mnd                     │
│  Ferie:               2 250 kr/mnd                     │
│  Pensjon:             1 250 kr/mnd                     │
│                                                         │
│  Total tilgjengelig: 8 000 kr/mnd                      │
│                                                         │
│  Med 8 000 kr/mnd betaler du ned gjelden på:          │
│  ~[X] måneder                                          │
│                                                         │
│  Vil du bruke alt tilgjengelig til nedbetaling?        │
│  [Ja, betal ned så fort som mulig]                     │
│  [Nei, la meg justere selv]                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Hvis "Ja, betal ned så fort som mulig": 
  - Sett alle spareposter (buffer, ferie, store livshendelser, pensjon) til 0
  - Opprett ny post "Kredittkortgjeld" med totalt beløp
  - Gå til oversikt
- Hvis "Nei, la meg justere selv":
  - Opprett post "Kredittkortgjeld" med 0 kr
  - Gå til oversikt
  - Bruker kan justere i detaljside
- Hvis "Nei, ingen gjeld":
  - Gå til oversikt uten gjeld-post

---

### 5.3 Oversikt

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Månedslønn: 30 000 kr                    [Endre lønn] │
│                                                         │
│  Her er et forslag til hvordan pengeflyten din kan se  │
│  ut. Klikk på hver post for å tilpasse til din         │
│  situasjon.                                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Faste utgifter              19 500 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Buffer                       2 750 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Guilt-free spending          2 500 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Ferie                        2 250 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Store livshendelser          1 750 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Pensjon                      1 250 kr/mnd    → │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Total: 30 000 kr/mnd                                  │
│                                                         │
│  [Se oppsummering av planen din →]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Hver post er klikkbart kort (går til detaljside)
- "Endre lønn" går tilbake til inngangsside (med advarsel hvis noe er justert)
- Totalen oppdateres automatisk når poster endres
- "Se oppsummering"-knapp alltid synlig

**Visuell indikator (valgfritt):**
Vis ✓ på poster bruker har interagert med:
```
│  │ Buffer                  2 750 kr/mnd  ✓     → │  │
```

---

### 5.4 Detaljside: Faste utgifter

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Faste utgifter                                         │
│                                                         │
│  Dette er husleie, strøm, mat, transport,              │
│  abonnementer og andre faste kostnader.                │
│                                                         │
│  Vi har antatt at dette er 65% av lønna di, men        │
│  du kan justere det hvis det ikke stemmer.             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Dine månedlige faste utgifter                   │  │
│  │ [19500_______] kr/mnd                           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Når du endrer dette, justeres de andre postene        │
│  automatisk for å balansere budsjettet.                │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Input-felt for eksakt beløp
- Live-validering: må være < lønn
- Ved endring: Omfordel differanse proporsjonalt på andre poster

**Omfordelingslogikk:**
```javascript
function omfordelEtterFasteUtgifter(nyeFasteUtgifter, lønn, poster) {
  const tilgjengelig = lønn - nyeFasteUtgifter;
  const nåværendeAndre = Object.entries(poster)
    .filter(([key]) => key !== 'fasteUtgifter')
    .reduce((sum, [, post]) => sum + post.månedlig, 0);
  
  if (nåværendeAndre === 0) return; // ingen å fordele på
  
  const faktor = tilgjengelig / nåværendeAndre;
  
  Object.entries(poster).forEach(([key, post]) => {
    if (key !== 'fasteUtgifter') {
      post.månedlig = Math.round(post.månedlig * faktor / 50) * 50;
    }
  });
  
  // Juster for avrundingsfeil
  justerTilTotal(lønn, poster);
}
```

---

### 5.5 Detaljside: Buffer

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Buffer                                                 │
│                                                         │
│  Buffer er nødfondet ditt – pengene du har             │
│  tilgjengelig hvis noe uventet skjer.                  │
│                                                         │
│  Målet er å ha 1,5× månedsinntekten din stående        │
│  (i ditt tilfelle: 45 000 kr).                         │
│                                                         │
│  Dette dekker de fleste uventede utgifter uten at      │
│  du må ta opp lån eller bruke kredittkort.             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Har du noe spart allerede?                      │  │
│  │ [_____________] kr                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📊 Mangler: 45 000 kr                                 │
│     Med 2 750 kr/mnd når du målet om: ~16 måneder      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hvor mye vil du spare per måned?                │  │
│  │                                                  │  │
│  │  [────●─────────────────] 2 750 kr/mnd          │  │
│  │  1000                             5000           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  💡 Hvis du øker til 3 500 kr/mnd:                     │
│     → Når målet om ~13 måneder                         │
│     → De ekstra 750 kr tas fra andre poster            │
│                                                         │
│     Hvor skal de tas fra?                              │
│     ○ Fordel likt mellom de andre postene              │
│     ○ La meg velge [→]                                 │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Input "allerede spart": Oppdaterer "Mangler" og tidshorisont
- Slider for månedlig beløp: Live-update av tidshorisont
- Hvis slider endres over nåværende: Vis konsekvens-valg
- "Fordel likt": Differanse fordeles proporsjonalt
- "La meg velge": Vis modal med checkboxer for andre poster

**Beregninger:**
```javascript
function beregnMånederTilMål(mål, alleredeSpart, månedlig) {
  const mangler = Math.max(0, mål - alleredeSpart);
  if (månedlig === 0) return Infinity;
  return Math.ceil(mangler / månedlig);
}

function formaterTidshorisont(måneder) {
  if (måneder === Infinity) return 'aldri';
  const år = Math.floor(måneder / 12);
  const restMåneder = måneder % 12;
  
  if (år === 0) return `~${måneder} måneder`;
  if (restMåneder === 0) return `~${år} år`;
  return `~${år} år, ${restMåneder} mnd`;
}
```

**Hvis "La meg velge":**
```
┌─────────────────────────────────────────────────────────┐
│  Du trenger 750 kr/mnd ekstra til buffer.               │
│                                                         │
│  Hvor skal det tas fra?                                │
│                                                         │
│  ☐ Guilt-free spending     (nå: 2 500 kr)              │
│  ☐ Ferie                   (nå: 2 250 kr)              │
│  ☐ Store livshendelser     (nå: 1 750 kr)              │
│  ☐ Pensjon                 (nå: 1 250 kr)              │
│                                                         │
│  [Bekreft]                                             │
└─────────────────────────────────────────────────────────┘
```

Fordel differansen likt mellom valgte poster.

---

### 5.6 Detaljside: Guilt-free spending

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Guilt-free spending                                    │
│                                                         │
│  Dette er pengene du kan bruke uten dårlig             │
│  samvittighet – en øl på byen, takeaway, en gadget.    │
│                                                         │
│  Dette er ikke grådighet, det er bærekraft. Hvis       │
│  budsjettet føles som et fengsel, holder du det ikke.  │
│                                                         │
│  Med 2 500 kr/mnd har du ca 575 kr/uke til fri bruk.   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hvor mye vil du ha til guilt-free?              │  │
│  │                                                  │  │
│  │  [─────●────────────────] 2 500 kr/mnd          │  │
│  │  1500                             4500           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Anbefalt: 2 100–3 600 kr/mnd                          │
│                                                         │
│  ⚠️  Over 3 600 kr/mnd kan gå på bekostning av         │
│     langsiktig trygghet. Er du sikker?                 │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Slider: Live-update av kr/uke
- Varsel vises hvis > anbefaltMaks (3 600 kr)
- Samme omfordelingslogikk som buffer

**Beregning kr/uke:**
```javascript
function beregnKrPerUke(månedlig) {
  return Math.round((månedlig * 12) / 52);
}
```

---

### 5.7 Detaljside: Ferie

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Ferie                                                  │
│                                                         │
│  Spare jevnlig til ferie i stedet for å bruke          │
│  kredittkort i juni.                                   │
│                                                         │
│  Målet er å ha nok på konto til en skikkelig ferie     │
│  uten å stresse. Anbefalt buffer-sum: 15 000 kr.      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Har du noe spart allerede?                      │  │
│  │ [_____________] kr                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📊 Mangler: 15 000 kr                                 │
│     Med 2 250 kr/mnd når du målet om: ~7 måneder       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hvor mye vil du spare per måned?                │  │
│  │                                                  │  │
│  │  [────●─────────────────] 2 250 kr/mnd          │  │
│  │  500                              3500           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  💡 Når du har spart 15 000 kr har du et sunt nivå.    │
│     Du kan da flytte pengene til andre mål, eller      │
│     fortsette å spare til større reiser.               │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Samme som buffer
- Fast mål: 15 000 kr
- Hvis alleredeSpart ≥ 15 000: Vis "mål nådd"-melding

**"Mål nådd"-scenario:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Ferie                                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Har du noe spart allerede?                      │  │
│  │ [30000________] kr                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  🎉 Du har spart mer enn anbefalt mål (15 000 kr)!     │
│                                                         │
│  De ekstra 15 000 kr kan flyttes til et annet          │
│  sparemål, eller du kan fortsette å spare til          │
│  større reiser.                                        │
│                                                         │
│  Hva vil du gjøre?                                     │
│                                                         │
│  ○ Flytte overskuddet (15 000 kr) til et annet mål    │
│  ○ Redusere månedlig sparing og flytte pengene        │
│  ○ Fortsett som nå (spare til større reiser)          │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 5.8 Detaljside: Store livshendelser

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Store livshendelser                                    │
│                                                         │
│  Dette er pengene du sparer til ting som bryllup,      │
│  barn, bil, eller andre større utgifter.              │
│                                                         │
│  Målet varierer basert på hva du trenger.              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hva skal du spare til?                          │  │
│  │                                                  │  │
│  │ ☐ Bryllup (50 000 – 250 000 kr)                │  │
│  │ ☐ Barn (30 000 kr for utstyr + løpende)        │  │
│  │ ☐ Bil (50 000 – 300 000 kr)                    │  │
│  │ ☐ Annet: [____________] [______] kr            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Ingenting ennå – jeg vet ikke]                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Har du noe spart allerede?                      │  │
│  │ [_____________] kr                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hvor mye vil du spare per måned?                │  │
│  │                                                  │  │
│  │  [────●─────────────────] 1 750 kr/mnd          │  │
│  │  500                              4000           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Når "Bryllup" velges:**
```
│  ☑ Bryllup                                          │
│     [────●──────] 150 000 kr                        │
│     50 000          250 000                         │
```

**Når "Barn" velges:**
```
│  ☑ Barn (30 000 kr for utstyr)                     │
```

**Når "Bil" velges:**
```
│  ☑ Bil                                              │
│     [────●──────] 150 000 kr                        │
│     50 000          300 000                         │
```

**Hvis flere valgt:**
```
│  Du har valgt: Bryllup (150 000 kr), Barn (30 000 kr)
│  Totalt mål: 180 000 kr
│  
│  📊 Mangler: 180 000 kr
│     Med 1 750 kr/mnd når du målet om: ~103 måneder
│     (8 år, 7 mnd)
```

**Funksjonalitet:**
- Checkboxer for vanlige mål
- Range-slider for bryllup/bil
- Fast beløp for barn (30 000 kr)
- Fritekst + input for egne mål
- Summer alle valgte mål → vis total og tidshorisont
- Hvis ingen valgt: Skjul "Mangler"-visning

---

### 5.9 Detaljside: Pensjon

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Oversikt                                             │
│                                                         │
│  Pensjon                                                │
│                                                         │
│  Jobbpensjonen dekker sjelden nok. Ved å spare         │
│  løpende nå, bygger du trygghet for fremtiden.         │
│                                                         │
│  💡 Skattefordel: Du kan spare opptil 15 000 kr/år i   │
│     individuell pensjonssparing (IPS) og få            │
│     skattefradrag.                                     │
│                                                         │
│  Med 1 250 kr/mnd sparer du 15 000 kr/år – du          │
│  utnytter hele fradraget.                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Hvor mye vil du spare per måned?                │  │
│  │                                                  │  │
│  │  [────●─────────────────] 1 250 kr/mnd          │  │
│  │  500                              3000           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Årlig sum: 15 000 kr                                  │
│                                                         │
│  ⚠️  Under 1 250 kr/mnd (15 000 kr/år) utnytter du     │
│     ikke hele skattefradraget.                         │
│                                                         │
│  [Tilbake til oversikt]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- Slider: Live-update av årlig sum
- Varsel hvis < 1 250 kr/mnd
- Ingen mål eller tidshorisont (løpende)

---

### 5.10 Oppsummering

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ✓ Din plan er klar                                    │
│                                                         │
│  Månedslønn: 30 000 kr                                 │
│                                                         │
│  Her er hvordan pengene dine fordeles:                 │
│                                                         │
│  Faste utgifter        19 500 kr/mnd                   │
│  Buffer                 2 750 kr/mnd                   │
│  Guilt-free spending    2 500 kr/mnd                   │
│  Ferie                  2 250 kr/mnd                   │
│  Store livshendelser    1 750 kr/mnd                   │
│  Pensjon                1 250 kr/mnd                   │
│                                                         │
│  ───────────────────────────────────────────────       │
│                                                         │
│  Neste steg:                                           │
│                                                         │
│  1. Sett opp faste overføringer i nettbanken din:      │
│                                                         │
│     → 2 750 kr til Buffer-konto (sparekonto)           │
│     → 2 250 kr til Ferie-konto (sparekonto)            │
│     → 1 750 kr til Store livshendelser (sparekonto)    │
│     → 1 250 kr til Pensjonssparing (IPS)               │
│                                                         │
│  2. Guilt-free spending (2 500 kr) blir stående på     │
│     brukskontoen din – dette er pengene du kan         │
│     bruke fritt.                                       │
│                                                         │
│  3. Kom tilbake når noe endrer seg:                    │
│     – Ny lønn                                          │
│     – Nye behov                                        │
│     – Du har nådd et sparemål                          │
│                                                         │
│  [Last ned som PDF] [Kopier til utklippstavle]         │
│  [Start på nytt]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funksjonalitet:**
- "Last ned som PDF": Generer PDF (bruk jsPDF eller lignende)
- "Kopier til utklippstavle": Kopier formatert tekst
- "Start på nytt": Reset state, gå til inngangsside

---

## 6. Kjernefunksjoner (algoritmer)

### 6.1 Omfordeling når en post endres

```javascript
function håndterPostEndring(postNavn, nyttBeløp, state) {
  const gammelBeløp = state.poster[postNavn].månedlig;
  const differanse = nyttBeløp - gammelBeløp;
  
  if (differanse === 0) return;
  
  // Spesialhåndtering for faste utgifter
  if (postNavn === 'fasteUtgifter') {
    omfordelEtterFasteUtgifter(nyttBeløp, state.lønn, state.poster);
    return;
  }
  
  // For andre poster: differanse må tas fra/gis til andre poster
  return {
    type: 'velg_fordeling',
    differanse,
    andrePoster: Object.keys(state.poster).filter(p => 
      p !== postNavn && p !== 'fasteUtgifter'
    )
  };
}

function fordelLikt(differanse, valgePoster, state) {
  if (!valgePoster || valgePoster.length === 0) return; // guard: ingen poster valgt

  const perPost = differanse / valgePoster.length;

  valgePoster.forEach(postNavn => {
    const nyVerdi = (state.poster[postNavn]?.månedlig ?? 0) - perPost;
    state.poster[postNavn].månedlig = Math.round(nyVerdi / 50) * 50;
  });

  justerTilTotal(state.lønn, state.poster);
}

function justerTilTotal(lønn, poster) {
  const total = Object.values(poster).reduce((sum, p) => sum + p.månedlig, 0);
  const diff = lønn - total;
  
  if (diff === 0) return;
  
  // Juster største post (vanligvis faste utgifter)
  const størstPost = Object.entries(poster)
    .sort((a, b) => b[1].månedlig - a[1].månedlig)[0];
  
  størstPost[1].månedlig += diff;
}
```

### 6.2 Håndtering av mål nådd

```javascript
function sjekkMålNådd(post) {
  if (!post.harMål) return null;
  if (!post.mål) return null;
  
  const overskudd = post.alleredeSpart - post.mål;
  if (overskudd <= 0) return null;
  
  return {
    postNavn: post.navn,
    mål: post.mål,
    alleredeSpart: post.alleredeSpart,
    overskudd,
    månedlig: post.månedlig
  };
}

function håndterMålNådd(målNåddInfo, state) {
  // Flere mål nådd samtidig?
  const alleMålNådd = Object.entries(state.poster)
    .filter(([, post]) => sjekkMålNådd(post) !== null)
    .map(([navn]) => navn);
  
  if (alleMålNådd.length > 1) {
    return foreslåAutomagiskFordeling(alleMålNådd, state);
  }
  
  // Ett mål nådd
  return {
    type: 'enkelt_mål_nådd',
    postNavn: målNåddInfo.postNavn,
    valg: [
      'flytt_overskudd',
      'reduser_månedlig',
      'fortsett_som_nå'
    ]
  };
}

function foreslåAutomagiskFordeling(målNåddPoster, state) {
  const tilgjengelig = målNåddPoster.reduce((sum, post) => 
    sum + state.poster[post].månedlig, 0
  );
  
  const tilMoro = Math.round(tilgjengelig * 0.3 / 50) * 50;
  const tilFornuft = tilgjengelig - tilMoro;
  const tilPensjon = Math.round(tilFornuft / 2 / 50) * 50;
  const tilStore = tilFornuft - tilPensjon;
  
  return {
    type: 'flere_mål_nådd',
    forslag: {
      guiltFree: state.poster.guiltFree.månedlig + tilMoro,
      pensjon: state.poster.pensjon.månedlig + tilPensjon,
      storeLivshendelser: state.poster.storeLivshendelser.månedlig + tilStore
    },
    begrunnelse: '30% til moro, 70% til fornuft'
  };
}
```

### 6.3 Validering

```javascript
function validerState(state) {
  const feil = [];

  // Sjekk total ≈ lønn (toleranse på 1 kr for avrundingsfeil)
  const aktivePoster = Object.values(state.poster).filter(p => p.aktiv !== false);
  const total = aktivePoster.reduce((sum, p) => sum + (p.månedlig || 0), 0);

  if (Math.abs(total - state.lønn) > 1) {
    feil.push(`Total (${total} kr) matcher ikke lønn (${state.lønn} kr)`);
  }
  
  // Sjekk ingen negative verdier
  Object.entries(state.poster).forEach(([navn, post]) => {
    if (post.månedlig < 0) {
      feil.push(`${navn} kan ikke være negativ`);
    }
  });
  
  // Sjekk faste utgifter < lønn
  if (state.poster.fasteUtgifter.månedlig >= state.lønn) {
    feil.push('Faste utgifter må være lavere enn lønn');
  }
  
  return feil;
}

function visAdvarselHvisHøyeFasteUtgifter(state) {
  const prosent = state.poster.fasteUtgifter.månedlig / state.lønn;
  
  if (prosent > 0.8) {
    return {
      type: 'advarsel',
      melding: 'Faste utgifter på over 80% av lønna gir svært lite rom til sparing. Vurder å kutte noen kostnader hvis mulig.'
    };
  }
  
  return null;
}
```

---

## 7. Persistent lagring (valgfritt)

Bruk localStorage for å lagre state mellom besøk:

```javascript
function lagreState(state) {
  try {
    localStorage.setItem('pengeprat_state', JSON.stringify(state));
  } catch (e) {
    console.error('Kunne ikke lagre state', e);
  }
}

function lastState() {
  try {
    const saved = localStorage.getItem('pengeprat_state');
    if (!saved) return null;
    
    return JSON.parse(saved);
  } catch (e) {
    console.error('Kunne ikke laste state', e);
    return null;
  }
}

function slettLagretState() {
  localStorage.removeItem('pengeprat_state');
}
```

**Når bruke:**
- Lagre ved hver endring (debounce)
- Last ved oppstart
- Slett ved "Start på nytt"

**Advarsel til bruker:**
```
💡 Vi lagrer planen din lokalt i nettleseren din.
   Ingen data sendes til servere.
```

---

## 8. Design og styling

### Fargepalett
```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #4A90E2;
  --success: #50C878;
  --warning: #FFB84D;
  --error: #E94B3C;
}
```

### Typografi
```css
body {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.beløp {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.breadcrumb {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

### Komponenter
- **Kort (oversikt)**: Hover-effekt, klikkbart
- **Input**: Stor, tydelig, monospace for tall
- **Slider**: Custom styling, tydelige min/maks-verdier
- **Knapper**: Primær (accent), sekundær (outline)
- **Modal**: Mørk overlay, sentrert innhold

---

## 9. Edge cases og feilhåndtering

### Scenario 1: Lønn for lav (< 15 000 kr)
```
⚠️  Med en lønn på 12 000 kr kan det være vanskelig å 
    både dekke faste utgifter og spare. Vurder å justere 
    faste utgifter hvis mulig, eller øke inntekt.
```

### Scenario 2: Faste utgifter > 85% av lønn
```
⚠️  Faste utgifter på over 85% av lønna gir svært lite rom 
    til sparing. Kan noe kuttes?
```

### Scenario 3: Bruker setter alle spareposter til 0
```
💡 Du har satt alle spareposter til 0 kr. Dette gir ingen 
   økonomisk trygghet. Er du sikker?
```

### Scenario 4: Total > lønn
```
⚠️  Totalsummen kan ikke være høyere enn lønna di. 
    Reduser en eller flere poster.
```
Blokkér navigasjon til oppsummering til dette er fikset.

---

## 10. Testing og kvalitetssikring

### Funksjonelle tester
- [ ] Standardfordeling summerer til 100%
- [ ] Omfordeling fungerer korrekt
- [ ] Mål-beregninger er korrekte
- [ ] Kredittkortgjeld-håndtering fungerer
- [ ] localStorage lagrer/laster korrekt
- [ ] PDF-generering fungerer
- [ ] Kopier-til-utklippstavle fungerer

### UX-tester
- [ ] Navigasjon er intuitiv
- [ ] Breadcrumbs fungerer
- [ ] Ingen "døde" states (stuck states)
- [ ] Feilmeldinger er forståelige
- [ ] Responsivt design på mobil/tablet

### Edge case-tester
- [ ] Lønn < 15 000 kr
- [ ] Lønn > 100 000 kr
- [ ] Faste utgifter = 90% av lønn
- [ ] Alle spareposter satt til 0
- [ ] Mål allerede nådd ved oppstart

---

## 11. Implementeringsprioritering

### Fase 1: MVP
Start her. Målet er noe som fungerer i nettleseren du kan teste og sende til folk.

1. Inngangsside med lønn-input (`type="text" inputmode="numeric"`)
2. Oversikt med standardfordeling (6 klikkbare kort)
3. Detaljsider for alle poster – kun slider + "tilbake til oversikt"
4. Oppsummering med tekstoppsummering og "Kopier til utklippstavle"
5. Grunnleggende omfordeling: "Fordel likt" mellom de andre postene
6. `visView`-routing med cachede DOM-referanser

**Ikke i fase 1:** kredittkortgjeld-modal, "La meg velge", mål nådd-logikk, localStorage, PDF.

### Fase 2: Robusthet
Når MVP-en er validert med ekte brukere.

1. Kredittkortgjeld-håndtering (via `<dialog>`, posten er allerede i state-modellen)
2. "La meg velge"-funksjonalitet for omfordeling
3. Mål nådd-logikk (seksjon 6.2)
4. Advarsler og valideringer (seksjon 6.3 og 9)
5. localStorage med debounce (300 ms)

### Fase 3: Polish
1. PDF-generering via `@media print` CSS (ingen biblioteker) – jsPDF kun hvis print ikke holder
2. Smooth animasjoner og overganger
3. Responsivt design (mobil-first)
4. Tilgjengelighet (a11y): ARIA-labels, fokushåndtering, `prefers-reduced-motion`
5. `prefers-color-scheme` for automatisk mørkt/lyst tema

---

## 12. Tekniske notater for implementering

### Inputfelter for beløp
Alle tallfelter i detaljsidene bruker samme mønster som lønn-input:

```html
<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
```

Dette gir numerisk tastatur på mobil uten quirksene til `type="number"`.

### HTML/CSS-spesifikke hensyn
- Hele appen lever i én enkelt `index.html`-fil (single-page application uten rammeverk)
- Alle «sider» er `<section class="view">`-elementer; kun den aktive har CSS-klassen `aktiv`
- All styling samles i én `style.css`
- JavaScript deles opp i modulære `.js`-filer og lastes med `<script type="module">`

### Anbefalt struktur
```
sparekalkulator/
  index.html                   # Alle view-seksjoner og HTML-skjelett
  style.css                    # Global CSS med CSS-variabler og komponentstiler
  js/
    state.js                   # State-objekt og state-håndtering
    beregninger.js             # Alle beregningsfunksjoner
    validering.js              # Valideringsfunksjoner
    lagring.js                 # localStorage-funksjoner
    router.js                  # View-switching og navigasjon
    main.js                    # Inngangspunkt, initialisering og event listeners
```

### State management
Bruk vanilla JavaScript med et globalt state-objekt og egendefinerte events:
- Oppdater state direkte og dispatch en `CustomEvent` for å trigge re-render
- Unngå tredjeparts biblioteker – alt skjer i nettleseren med innebygd Web API

---

## Oppsummering

Dette dokumentet dekker:
✅ Komplett datamodell  
✅ Alle sider og komponenter  
✅ Beregningsalgoritmer  
✅ Navigasjonsflyt  
✅ Edge cases  
✅ Designspesifikasjoner  
✅ Implementeringsprioritering  

**Neste steg:** Implementer i Claude Code med fokus på MVP først, deretter forbedringer.