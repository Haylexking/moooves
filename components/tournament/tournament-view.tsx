"use client"

import { useMemo } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import type { Tournament, BracketMatch } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, DollarSign, Trophy, Share2, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface TournamentViewProps {
  tournament: Tournament
}

export function TournamentView({ tournament }: TournamentViewProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const router = useRouter()
  const isHost = user?.id === tournament.hostId

  const handleStartTournament = async () => {
    try {
      const res = await apiClient.startTournament(tournament.id)
      if (res.success) {
        toast({ title: "Tournament Started", description: "The bracket has been generated." })
        router.refresh()
      } else {
        toast({ title: "Error", description: res.error || "Failed to start tournament", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
    }
  }

  const participants = tournament.participants || []
  const participantNames = useMemo(() => {
    const map = new Map<string, string>()
    participants.forEach((p, index) => {
      map.set(p.userId, p.email?.split("@")[0] || `Player ${index + 1}`)
    })
    return map
  }, [participants])

  const rounds = tournament.bracket?.rounds ?? []

  const upcomingMatch: BracketMatch | null = useMemo(() => {
    if (!user?.id) return null
    return (
      rounds
        .flatMap((round) => round.matches)
        .find(
          (match) =>
            match.status !== "completed" &&
            (match.player1Id === user.id || match.player2Id === user.id),
        ) || null
    )
  }, [rounds, user?.id])

  const opponentName = (match: BracketMatch | null) => {
    if (!match || !user?.id) return "TBD"
    const opponentId = match.player1Id === user.id ? match.player2Id : match.player1Id
    if (!opponentId) return "Waiting for opponent"
    return participantNames.get(opponentId) || opponentId
  }

  const formatDateTime = (value?: number) => {
    if (!value) return "TBD"
    return new Date(value).toLocaleString()
  }

  const handleShareCode = async () => {
    try {
      await navigator.clipboard.writeText(tournament.inviteCode)
    } catch { }
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-28 relative">
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 gap-2"
          onClick={() => router.push(isHost ? '/host-dashboard' : '/dashboard')}
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Leave Lobby
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
          <p className="text-green-100">Tournament lobby &mdash; stay ready for your matches.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <InfoCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Players">
            {tournament.currentPlayers}/{tournament.maxPlayers}
          </InfoCard>
          <InfoCard icon={<DollarSign className="w-6 h-6 text-green-600" />} label="Entry Fee">
            ₦{(tournament.entryFee || 0).toLocaleString()}
          </InfoCard>
          <InfoCard icon={<Trophy className="w-6 h-6 text-yellow-600" />} label="Prize Pool">
            ₦{(tournament.totalPool || 0).toLocaleString()}
          </InfoCard>
          <InfoCard icon={<Clock className="w-6 h-6 text-purple-600" />} label="Status">
            <span className="capitalize">{tournament.status}</span>
          </InfoCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-white/95 shadow-md">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{isHost ? "Host Controls" : "Lobby Details"}</CardTitle>
                <p className="text-sm text-gray-500">
                  {isHost ? "Manage your tournament settings" : "Review tournament rules and settings"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShareCode}>
                <Share2 className="w-4 h-4" />
                {tournament.inviteCode}
              </Button>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <LobbyStat
                label="Status"
                value={tournament.status}
                helper={isHost ? "You can start when ready" : "Waiting for host"}
              />
              <LobbyStat
                label="Start Time"
                value={formatDateTime(tournament.startedAt || tournament.createdAt)}
                helper="Scheduled kick-off"
              />
              <LobbyStat
                label="Match duration"
                value={`${tournament.matchDuration || 10} mins`}
                helper="Per round limit"
              />
              <LobbyStat
                label="Game mode"
                value={tournament.gameMode}
                helper={isHost ? "Configured by you" : "Set by host"}
              />
            </CardContent>
          </Card>

          <Card className="bg-white/95 shadow-md">
            <CardHeader>
              <CardTitle>Your next match</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMatch ? (
                <>
                  <div className="text-sm text-gray-500">Round {upcomingMatch.roundNumber}</div>
                  <div className="text-lg font-semibold text-gray-900">{opponentName(upcomingMatch)}</div>
                  <div className="text-sm text-gray-600 capitalize">Status: {upcomingMatch.status}</div>
                  <p className="text-xs text-gray-500">
                    You&apos;ll receive a notification when it&apos;s time to enter the game room.
                  </p>
                  <ButtonLink
                    label="Go to match lobby"
                    disabled
                    helper="Available when host begins the round"
                  />
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  No match assigned yet. Hang tight while the bracket gets ready.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-white/95 shadow-md">
            <CardHeader>
              <CardTitle>Tournament Draw</CardTitle>
            </CardHeader>
            <CardContent>
              {rounds.length === 0 ? (
                <EmptyState isHost={isHost} onStart={handleStartTournament} />
              ) : (
                <div className="space-y-4">
                  {rounds.map((round) => (
                    <div key={round.roundNumber} className="border rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold">
                          Round {round.roundNumber} <span className="text-xs text-gray-500">({round.status})</span>
                        </p>
                      </div>
                      <div className="space-y-3">
                        {round.matches.map((match) => (
                          <div
                            key={match.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-100 p-3 bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {participantNames.get(match.player1Id) || match.player1Id || "TBD"}
                              </p>
                              <p className="text-sm font-semibold text-gray-800">
                                {participantNames.get(match.player2Id) || match.player2Id || "TBD"}
                              </p>
                            </div>
                            <span className={`mt-2 sm:mt-0 text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(match.status)}`}>
                              {match.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/95 shadow-md">
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[360px] overflow-auto">
              {participants.length === 0 ? (
                <p className="text-sm text-gray-600">No players registered yet.</p>
              ) : (
                participants.map((p, index) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-none"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {participantNames.get(p.userId) || `Player ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(p.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {tournament.winners?.length ? (
          <Card className="bg-white/95 shadow-md">
            <CardHeader>
              <CardTitle>Winners</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-3">
              {tournament.winners.map((winner) => (
                <div key={winner.userId} className="bg-yellow-50 rounded-lg border border-yellow-200 p-3">
                  <p className="text-sm text-yellow-800 font-semibold">Rank {winner.rank}</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {participantNames.get(winner.userId) || winner.userId}
                  </p>
                  <p className="text-sm text-yellow-700">Prize: ₦{winner.prize.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

const statusBadge = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "waiting":
      return "bg-yellow-100 text-yellow-800"
    case "completed":
      return "bg-gray-200 text-gray-700"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

const InfoCard = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) => (
  <Card className="bg-green-100/95 border border-green-600 shadow-sm">
    <CardContent className="p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs uppercase text-green-700 font-medium">{label}</p>
        <p className="text-xl font-bold text-green-900">{children}</p>
      </div>
    </CardContent>
  </Card>
)

const LobbyStat = ({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) => (
  <div className="p-3 rounded-lg border border-gray-100 bg-white shadow-sm">
    <p className="text-xs uppercase text-gray-400">{label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
    {helper && <p className="text-xs text-gray-500">{helper}</p>}
  </div>
)

const ButtonLink = ({
  label,
  disabled,
  helper,
}: {
  label: string
  disabled?: boolean
  helper?: string
}) => (
  <button
    disabled={disabled}
    className={`w-full py-3 text-sm font-semibold rounded-lg ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
      }`}
  >
    {label}
    {helper && <p className="text-xs font-normal text-gray-600 mt-1">{helper}</p>}
  </button>
)

const EmptyState = ({ isHost, onStart }: { isHost: boolean; onStart: () => void }) => (
  <div className="text-center py-10 text-gray-500">
    <Calendar className="w-10 h-10 mx-auto mb-4 text-gray-300" />
    <p className="mb-4">
      {isHost
        ? "You haven't started the tournament yet."
        : "The host hasn't started the bracket yet. Check back closer to kickoff."}
    </p>
    {isHost && (
      <Button onClick={onStart} className="bg-green-600 hover:bg-green-700 text-white">
        Start Tournament
      </Button>
    )}
  </div>
)
