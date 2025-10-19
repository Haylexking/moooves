import React, { Suspense } from "react"
import dynamicImport from "next/dynamic"

export const dynamic = "force-dynamic"

const OnboardingPlayerClient = dynamicImport(() => import("@/components/onboarding/onboarding-player-client"), { ssr: false })

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingPlayerClient />
    </Suspense>
  )
}
