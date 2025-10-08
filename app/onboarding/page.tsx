import React, { Suspense } from "react"
import dynamicImport from "next/dynamic"

export const dynamic = "force-dynamic"

const OnboardingClient = dynamicImport(() => import("@/components/onboarding/onboarding-client"), { ssr: false })

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OnboardingClient />
    </Suspense>
  )
}
