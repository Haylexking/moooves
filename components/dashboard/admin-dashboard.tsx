"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, DollarSign, Activity } from "lucide-react"

export function AdminDashboard() {
  // TODO: Load actual admin stats
  const stats = {
    totalUsers: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    platformRevenue: 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor platform activity and manage users</p>
      </div>

      {/* Admin Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Tournaments</p>
                <p className="text-2xl font-bold">{stats.activeTournaments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-bold">₦{stats.platformRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Payment Gateway</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Game Servers</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
