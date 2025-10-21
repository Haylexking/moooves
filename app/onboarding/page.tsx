import React, { Suspense } from "react"
import dynamicImport from "next/dynamic"

export const dynamic = "force-dynamic"

const PlayerOnboardingClient = dynamicImport(() => import("@/components/onboarding/player-onboarding-client"), { ssr: false })

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PlayerOnboardingClient />
    </Suspense>
  )
}
