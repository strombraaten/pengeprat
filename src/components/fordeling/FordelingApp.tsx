import { useFordelingState } from "@/hooks/useFordelingState"
import { Inngang } from "./Inngang"
import { FordelingDashboard } from "./FordelingDashboard"
import { FasteTrekk } from "./FasteTrekk"
import { Feiring } from "./Feiring"

export function FordelingApp() {
  const {
    state,
    start,
    endrePost,
    endreFasteUtgifter,
    endreAlleredeSpart,
    endreMål,
    tilbakestill,
    visView,
  } = useFordelingState()

  // Fires confetti and transitions to the celebration screen.
  // Called from FasteTrekk once all transfers are checked off.
  async function handleFullført() {
    const { default: confetti } = await import(
      // @ts-expect-error – CDN-import without types
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.module.mjs"
    )
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
    setTimeout(
      () =>
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        }),
      250
    )
    setTimeout(
      () =>
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        }),
      400
    )
    setTimeout(() => visView("feiring"), 1200)
  }

  switch (state.view) {
    case "inngang":
      return <Inngang onStart={start} />

    case "dashboard":
      return (
        <FordelingDashboard
          lønn={state.lønn!}
          poster={state.poster}
          onEndrePost={endrePost}
          onEndreFasteUtgifter={endreFasteUtgifter}
          onEndreAlleredeSpart={endreAlleredeSpart}
          onEndreMål={endreMål}
          onTilbakestill={tilbakestill}
          onEndreLønn={() => visView("inngang")}
          onBekreft={() => visView("fasteTrekk")}
        />
      )

    case "fasteTrekk":
      return (
        <FasteTrekk
          lønn={state.lønn!}
          poster={state.poster}
          onTilbake={() => visView("dashboard")}
          onFullført={handleFullført}
        />
      )

    case "feiring":
      return <Feiring onTilbakeTilPlan={() => visView("dashboard")} />
  }
}
