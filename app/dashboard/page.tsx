"use client"

import { PlayerDashboard } from "@/components/dashboard/player-dashboard"

// Completely isolated dashboard - no auth checks
export default function DashboardPage() {
  return <PlayerDashboard />
}
