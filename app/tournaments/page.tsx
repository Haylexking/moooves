"use client"

import TournamentDashboard from "@/components/tournament/tournament-dashboard"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TournamentsPage() {
  return (
    <ProtectedRoute>
      <div className="pt-24 sm:pt-28">
        <TournamentDashboard />
      </div>
    </ProtectedRoute>
  )
}
