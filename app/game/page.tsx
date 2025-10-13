import GamePageClient from '@/components/game/game-page-client'

// Force dynamic rendering for this page to avoid prerendering bailout
export const dynamic = 'force-dynamic'

export default function Page() {
  // Server wrapper: render the client-only page component
  return <GamePageClient />
}
