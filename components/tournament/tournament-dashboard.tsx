"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { apiClient } from "@/lib/api/client"
import type { Tournament } from "@/lib/types"
import Image from "next/image"
import { Check, ChevronRight, User } from "lucide-react"
import { GameButton } from "@/components/ui/game-button"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"

type TabType = "leaderboard" | "matches" | "rules"
type TournamentStage = "knockout" | "quarterfinal" | "semifinal" | "final"
type UserTournamentStatus = "not_registered" | "registered_active" | "eliminated" | "completed"

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  score: number
  medal?: "gold" | "silver" | "bronze"
}

interface Match {
  id: string
  player1: string
  player2: string
  winner?: string
  completed: boolean
  stage: TournamentStage
}

export default function TournamentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("leaderboard")
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(false)
  const [userStatus, setUserStatus] = useState<UserTournamentStatus>("not_registered")
  const [tournamentMatches, setTournamentMatches] = useState<Match[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [joinCode, setJoinCode] = useState("")
  const [joinLoading, setJoinLoading] = useState(false)

  const { user } = useAuthStore()
  const currentUserId = user?.id || ""
  const currentUserName = user?.fullName || "Player"

  // Fetch only tournaments the user is registered for
  useEffect(() => {
    if (!user) return
    setLoading(true)
    apiClient.getAllTournaments().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        // Filter tournaments where user is a participant
        const userTournaments = res.data.filter((t: any) =>
          t.participants?.some((p: any) => p.userId === user.id)
        )
        setTournaments(userTournaments)
      }
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    apiClient.getTournament(selectedTournament.id).then((res) => {
      if (res.success && res.data && res.data.bracket && Array.isArray(res.data.bracket.rounds)) {
        const allMatches = res.data.bracket.rounds.flatMap((round: any) =>
          round.matches.map((m: any) => ({
            id: m.id,
            player1: m.player1Id,
            player2: m.player2Id,
            winner: m.winnerId,
            completed: m.status === "completed",
            stage: `round${round.roundNumber}` as TournamentStage,
          }))
        );
        setTournamentMatches(allMatches);
      } else {
        setTournamentMatches([]);
      }
      setLoading(false);
    });
    apiClient.getTournamentWinners(selectedTournament.id).then(async (res) => {
      if (res.success && Array.isArray(res.data)) {
        setLeaderboard(
          res.data.map((entry: any, idx: number) => ({
            rank: entry.rank || idx + 1,
            userId: entry.userId,
            username: entry.username || `User ${entry.userId.substring(0, 6)}`,
            score: entry.prize || 0,
            medal:
              entry.rank === 1
                ? "gold"
                : entry.rank === 2
                  ? "silver"
                  : entry.rank === 3
                    ? "bronze"
                    : undefined,
          }))
        );
        // Automatically trigger payout if tournament is completed and winners exist
        if (selectedTournament.status === "completed" && res.data.length >= 3) {
          try {
            const payoutRes = await fetch(`/api/v1/payouts/distribute/${selectedTournament.id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              },
              body: JSON.stringify({ winners: res.data }),
            });
            const payoutData = await payoutRes.json();
            if (!payoutRes.ok || !payoutData.success) {
              console.error("Payout distribution failed:", payoutData.error);
            } else {
              console.log("Payout distribution successful.");
            }
          } catch (err) {
            console.error("Error distributing payout:", err);
          }
        }
      } else {
        setLeaderboard([]);
      }
    });
  }, [selectedTournament]);

  const handleStartTournament = () => {
    window.location.href = "/dashboard"
  }

  const handleEnterTournament = () => {
    setUserStatus("registered_active")
    // TODO: Call API to join tournament
    console.log("Entering tournament...")
  }

  const handleJoinByCode = async () => {
    if (!joinCode || !user) return
    setJoinLoading(true)
    try {
      const res = await apiClient.joinTournamentWithCode(joinCode, user.id)
      if (res.success) {
        // Refetch tournaments after joining
        apiClient.getAllTournaments().then((res2) => {
          if (res2.success && Array.isArray(res2.data)) {
            const userTournaments = res2.data.filter((t: any) =>
              t.participants?.some((p: any) => p.userId === user.id)
            )
            setTournaments(userTournaments)
          }
        })
        setJoinCode("")
        alert("Joined tournament!")
      } else {
        alert(res.error || "Failed to join tournament")
      }
    } catch (err) {
      alert("Error joining tournament")
    }
    setJoinLoading(false)
  }

  useEffect(() => {
    if (!selectedTournament) return
    const tournament = tournaments.find((t) => t.id === selectedTournament.id)
    if (tournament) {
      setUserStatus(
        tournament.participants?.some((p: any) => p.userId === user?.id)
          ? "registered_active"
          : "not_registered"
      )
    }
  }, [selectedTournament, tournaments, user])

  const getMatchesByStage = (stage: TournamentStage) => {
    return tournamentMatches.filter((match) => match.stage === stage)
  }

  const isUserInMatch = (match: Match) => {
    return match.player1 === currentUserId || match.player2 === currentUserId
  }

  const hasTournament = !!selectedTournament

  const getTournamentButton = () => {
    if (!selectedTournament) {
      return { text: "Start a tournament", action: handleStartTournament }
    }
    switch (userStatus) {
      case "not_registered":
        return { text: "Register for tournament", action: handleJoinByCode }
      case "registered_active":
        return { text: "Continue tournament", action: () => console.log("Continue tournament") }
      case "eliminated":
        return { text: "View results", action: () => console.log("View results") }
      case "completed":
        return { text: "Tournament completed", action: () => console.log("Tournament completed") }
      default:
        return { text: "Register for tournament", action: handleJoinByCode }
    }
  }

  const renderMatch = (match: Match) => {
    const isUserMatch = isUserInMatch(match)
    const userIsActive = userStatus === "registered_active"
    return (
      <div
        key={match.id}
        className="flex items-center justify-between p-3 bg-green-100/30 rounded-lg border border-green-300/30 mb-2"
      >
        <div className="flex items-center gap-2">
          {match.completed ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 ${isUserMatch && match.player1 === currentUserId && userIsActive
                ? "text-green-600 font-bold"
                : "text-gray-700"
              }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isUserMatch && match.player1 === currentUserId && userIsActive ? "bg-green-600" : "bg-gray-600"
                }`}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <span>User {match.player1}</span>
          </div>
          <span className="font-bold text-gray-600">VS</span>
          <div
            className={`flex items-center gap-2 ${isUserMatch && match.player2 === currentUserId && userIsActive
                ? "text-green-600 font-bold"
                : "text-gray-700"
              }`}
          >
            <span>User {match.player2}</span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isUserMatch && match.player2 === currentUserId && userIsActive ? "bg-green-600" : "bg-gray-600"
                }`}
            >
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">{match.completed && <Check className="w-5 h-5 text-green-600" />}</div>
      </div>
    )
  }

  const getMedalIcon = (medal?: string) => {
    switch (medal) {
      case "gold":
        return "🥇"
      case "silver":
        return "🥈"
      case "bronze":
        return "🥉"
      default:
        return "🏅"
    }
  }

  const getMedalColor = (medal?: string) => {
    switch (medal) {
      case "gold":
        return "text-yellow-600"
      case "silver":
        return "text-gray-500"
      case "bronze":
        return "text-orange-600"
      default:
        return "text-green-600"
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />
      <GlobalSidebar />
      <div className="relative z-20">
        <TopNavigation />
      </div>
      <div className="relative z-10 flex items-center justify-center mt-4">
        <div className="w-full max-w-3xl">
          {/* Tournaments Modal */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl mb-6">
            <h2 className="text-2xl font-bold text-green-800 text-center mb-6">Tournaments</h2>
            {loading ? (
              <div className="text-green-700 text-center py-8">Loading tournaments...</div>
            ) : tournaments.length === 0 ? (
              <div className="text-green-700 text-center py-8">No tournaments available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className={`bg-green-200/50 border-2 border-green-400 rounded-xl p-4 flex flex-col gap-2 shadow-md ${selectedTournament?.id === tournament.id ? "ring-2 ring-green-600" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-green-900 text-lg">{tournament.name}</div>
                        <div className="text-xs text-green-700">
                          Status:{" "}
                          <span className="font-semibold">{tournament.status}</span>
                        </div>
                        <div className="text-xs text-green-700">
                          Entry Fee: ₦{tournament.entryFee?.toLocaleString?.() ?? "-"}
                        </div>
                        <div className="text-xs text-green-700">
                          Players: {tournament.currentPlayers} / {tournament.maxPlayers}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <GameButton
                          onClick={() => setSelectedTournament(tournament)}
                          variant={selectedTournament?.id === tournament.id ? "pressed" : "default"}
                        >
                          {selectedTournament?.id === tournament.id ? "Selected" : "View"}
                        </GameButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Join by code UI - Moved below the modal */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-green-800 text-center mb-4">Join Tournament</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="border border-green-400 rounded-lg px-3 py-2 flex-1"
                placeholder="Paste tournament invite code here"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                disabled={joinLoading}
              />
              <GameButton onClick={handleJoinByCode} disabled={joinLoading || !joinCode}>
                {joinLoading ? "Joining..." : "Join"}
              </GameButton>
            </div>
          </div>
        </div>
      </div>
      {selectedTournament && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setSelectedTournament(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
              >
                <span className="w-5 h-5">×</span>
              </button>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-green-800">{selectedTournament.name} Details</h3>
                <span className="text-green-700 text-sm">Status: {selectedTournament.status}</span>
              </div>
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "leaderboard"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700 border border-green-400"
                    }`}
                  onClick={() => setActiveTab("leaderboard")}
                >
                  Leaderboard
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "matches"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700 border border-green-400"
                    }`}
                  onClick={() => setActiveTab("matches")}
                >
                  Matches
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "rules"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700 border border-green-400"
                    }`}
                  onClick={() => setActiveTab("rules")}
                >
                  Rules
                </button>
              </div>
              <div>
                {activeTab === "leaderboard" && (
                  <div>
                    <h4 className="font-bold text-green-800 mb-2">Leaderboard</h4>
                    {leaderboard.length === 0 ? (
                      <div className="text-green-700">No leaderboard data yet.</div>
                    ) : (
                      <ul className="divide-y divide-green-200">
                        {leaderboard.map((entry) => (
                          <li key={entry.userId} className="flex items-center gap-4 py-2">
                            <span className={`text-2xl ${getMedalColor(entry.medal)}`}>{getMedalIcon(entry.medal)}</span>
                            <span className="font-semibold text-green-900">{entry.username}</span>
                            <span className="ml-auto font-bold text-green-700">{entry.score}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {activeTab === "matches" && (
                  <div>
                    <h4 className="font-bold text-green-800 mb-2">Matches</h4>
                    {tournamentMatches.length === 0 ? (
                      <div className="text-green-700">No matches yet.</div>
                    ) : (
                      <div>{tournamentMatches.map((match) => renderMatch(match))}</div>
                    )}
                  </div>
                )}
                {activeTab === "rules" && (
                  <div className="text-green-700">
                    <h4 className="font-bold text-green-800 mb-2">Tournament Rules</h4>
                    <ul className="list-disc pl-6">
                      <li>Win by 5 in a row or highest score if time/board ends.</li>
                      <li>Scoring: 2 in a row = 1pt, 3 in a row = 3pt, 4 in a row = 5pt.</li>
                      <li>Top 3 get prizes. Entry fee required.</li>
                      <li>Elimination on loss. Bracket advances each round.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
