"use client"

import TournamentDashboard from "@/components/tournament/tournament-dashboard"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TournamentsPage() {
  return (
    <ProtectedRoute>
      <TournamentDashboard />
    </ProtectedRoute>
  )
}
