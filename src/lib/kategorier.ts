import type { Kategori } from "@/types/fordeling"

export const KATEGORIER: Kategori[] = [
  {
    id: "fasteUtgifter",
    navn: "Faste utgifter",
    farge: "oklch(0.58 0.16 250)",
    beskrivelse:
      "Husleie/lån, strøm, forsikring, mat, transport, abonnementer.",
    forklaring:
      "Vi har antatt at dette er 65% av lønna di, men du kan justere det hvis det ikke stemmer. Dette inkluderer alt du er forpliktet til å betale hver måned – husleie eller boliglån, strøm, forsikring, mat, transport og faste abonnementer.",
    inputType: "tekst",
  },
  {
    id: "buffer",
    navn: "Buffer",
    farge: "oklch(0.62 0.15 185)",
    beskrivelse: "Penger på sparekonto for uforutsette utgifter.",
    forklaring:
      "Buffer er nødfondet ditt – pengene du har tilgjengelig hvis noe uventet skjer. Målet er å ha 1,5× månedsinntekten din stående. Dette dekker de fleste uventede utgifter uten at du må ta opp lån eller bruke kredittkort.",
    inputType: "slider",
    harAlleredeSpart: true,
    harTidshorisont: true,
    sliderMaxFaktor: 0.22,
  },
  {
    id: "guiltFree",
    navn: "Guilt-free spending",
    farge: "oklch(0.65 0.14 70)",
    beskrivelse:
      "Penger du bruker uten dårlig samvittighet — kaffe, klær, hobbyer, uteliv.",
    forklaring:
      "Dette er pengene du kan bruke uten dårlig samvittighet – en øl på byen, takeaway, en gadget. Dette er ikke grådighet, det er bærekraft. Hvis budsjettet føles som et fengsel, holder du det ikke.",
    inputType: "slider",
    harKrPerUke: true,
    sliderMaxFaktor: 0.18,
  },
  {
    id: "ferie",
    navn: "Ferie",
    farge: "oklch(0.63 0.15 30)",
    beskrivelse:
      "Spare jevnlig til ferie i stedet for å bruke kredittkort i juni.",
    forklaring:
      "Spare jevnlig til ferie i stedet for å finansiere den med kredittkort. Målet er å ha nok på konto til en skikkelig ferie uten å stresse. Anbefalt sum: 15 000 kr – det dekker en god ferie for de fleste.",
    inputType: "slider",
    harAlleredeSpart: true,
    harTidshorisont: true,
    sliderMaxFaktor: 0.15,
  },
  {
    id: "storeLivshendelser",
    navn: "Store livshendelser",
    farge: "oklch(0.53 0.19 295)",
    beskrivelse: "Bryllup, barn, bil, eller andre store utgifter.",
    forklaring:
      "Dette er pengene du sparer til ting som bryllup, barn, bil, eller andre større utgifter. Statistisk sett kommer mange til å gifte seg, få barn og kjøpe bil. Ved å sette av litt jevnlig slipper du å ta opp forbrukslån når livet skjer.",
    inputType: "slider",
    harAlleredeSpart: true,
    harTidshorisont: true,
    harMålInput: true,
    sliderMaxFaktor: 0.2,
  },
  {
    id: "pensjon",
    navn: "Pensjon",
    farge: "oklch(0.62 0.15 140)",
    beskrivelse: "Langsiktig sparing du ikke rører før pensjonsalder.",
    forklaring:
      "Jobbpensjonen dekker sjelden nok – typisk 50–66% av lønna i pensjon. Egen sparing tetter gapet. Jo tidligere du starter, jo mer gjør renters rente for deg. Skattefordel: Du kan spare opptil 15 000 kr/år i individuell pensjonssparing (IPS) og få skattefradrag.",
    inputType: "slider",
    harPensjonVisning: true,
    sliderMaxFaktor: 0.12,
  },
]
