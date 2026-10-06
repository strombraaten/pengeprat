# Pengeprat

Alle vil bare slippe å tenke på penger. Pengeprat er en samling enkle verktøy som gir deg akkurat den følelsen — uten innlogging, uten sporing, alt skjer lokalt i nettleseren.

**[pengeprat.simenlager.no](https://pengeprat.simenlager.no)**

## Filosofien bak

Penger er en av de vanligste kildene til frustrasjon. Hvor de fleste av oss vil ha nok til å «ikke måtte tenke på det». Det handler ikke om å bli rik — det handler om en følelse av kontroll og oversikt. Du vil bare vite for din egen del at:

1. Du kan dekke en uforutsett utgift, eller fler (buffer)
2. Du kan kose deg innen rimelighetens grenser («guilt-free spending»)
3. Du kan si ja til sosiale og spontane forespørsler uten å tenke deg om
4. Framtids-deg er tatt hånd om (pensjon)
5. Du tenker langsiktig (bil, bryllup, hus og så videre)
6. Du kan tillate deg selv å drømme (frihetsfond)

Du trenger ikke nå alle sparemålene dine. Det eneste du trenger er å vite at du tar smarte valg hver måned når lønna kommer inn — og at du har en overordnet plan.

## Verktøy

Verktøyene er steg som bygger på hverandre. Resultatet samles i én plan.

| # | Verktøy | Beskrivelse |
|---|---|---|
| 01 | [Månedlige utgifter](https://pengeprat.simenlager.no/utgifter) | Kartlegg faste månedlige utgifter. Summen foreslås som faste utgifter i Fordeling. |
| 02 | [Fordeling](https://pengeprat.simenlager.no/fordeling) | Fordel lønna på spareområdene og sett opp faste trekk. |
| 03 | [Definer taket](https://pengeprat.simenlager.no/sparemaal) | Sett et tak for hvert sparemål. Målene brukes i Fordeling til å regne ut når du er i mål. |
| 04 | [Uventet sum](https://pengeprat.simenlager.no/uventet-sum) | Fordel en bonus eller arv — med forslag ut fra hva som mangler på målene dine. |
| — | [Min plan](https://pengeprat.simenlager.no/plan) | Alt samlet: månedlige trekk, sparemål og når du er i mål. Utskrift og sikkerhetskopi. |

## Dokumentasjon

- [docs/produkt.md](docs/produkt.md) — prinsippene, flyten mellom stegene og reglene i beregningene
- [docs/arkitektur.md](docs/arkitektur.md) — hvordan koden er satt sammen, lagring, testing

## Utvikling

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # lint, typesjekk, tester og bygg — det samme som CI kjører
```

## Stack

- [Astro 5](https://astro.build) + [React 19](https://react.dev)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev) for tester
- localStorage for all persistence — ingen backend
