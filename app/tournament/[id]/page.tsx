import { TournamentPageClient } from "@/components/tournament/tournament-page-client"

interface Props {
  params: { id: string }
}

export default function TournamentPage({ params }: Props) {
  return <TournamentPageClient tournamentId={params.id} />
}
