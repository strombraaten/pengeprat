import { useFordelingState } from "@/hooks/useFordelingState"
import { Inngang } from "./Inngang"
import { FordelingDashboard } from "./FordelingDashboard"
import { FasteTrekk } from "./FasteTrekk"
import { Feiring } from "./Feiring"

// Konfetti er pynt — den skal aldri kunne stoppe brukeren fra å komme videre.
// Lastes først når den trengs, og hoppes over ved «redusert bevegelse».
async function skytKonfetti() {
  try {
    const { default: confetti } = await import("canvas-confetti")
    const felles = { disableForReducedMotion: true }
    confetti({ ...felles, particleCount: 120, spread: 70, origin: { y: 0.6 } })
    setTimeout(
      () => confetti({ ...felles, particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } }),
      250
    )
    setTimeout(
      () => confetti({ ...felles, particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } }),
      400
    )
  } catch {
    // Ingen konfetti — helt greit
  }
}

export function FordelingApp() {
  const {
    state,
    start,
    endreLønn,
    endrePost,
    endreFasteUtgifter,
    endreAlleredeSpart,
    endreMål,
    tilbakestill,
    fullførFasteTrekk,
    visView,
  } = useFordelingState()

  // Kalles fra FasteTrekk når alle trekk er huket av
  function handleFullført() {
    fullførFasteTrekk()
    void skytKonfetti()
    setTimeout(() => visView("feiring"), 1200)
  }

  // Uten lønn finnes det ingen plan å vise — start på inngangen
  if (state.view === "inngang" || !state.lønn) {
    return <Inngang onStart={start} />
  }

  switch (state.view) {
    case "dashboard":
      return (
        <FordelingDashboard
          lønn={state.lønn}
          poster={state.poster}
          onEndrePost={endrePost}
          onEndreFasteUtgifter={endreFasteUtgifter}
          onEndreAlleredeSpart={endreAlleredeSpart}
          onEndreMål={endreMål}
          onTilbakestill={tilbakestill}
          onEndreLønn={endreLønn}
          onBekreft={() => visView("fasteTrekk")}
        />
      )

    case "fasteTrekk":
      return (
        <FasteTrekk
          poster={state.poster}
          onTilbake={() => visView("dashboard")}
          onFullført={handleFullført}
        />
      )

    case "feiring":
      return <Feiring onTilbakeTilPlan={() => visView("dashboard")} />
  }
}
