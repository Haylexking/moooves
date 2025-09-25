"use client"


import { TournamentDashboard } from "@/components/tournament/tournament-dashboard"
import { GlobalSidebar } from "@/components/ui/global-sidebar"

export default function TournamentsPage() {
  return (
    <>
  <GlobalSidebar />
      <div className="ml-64">
        <TournamentDashboard />
      </div>
    </>
  )
}
