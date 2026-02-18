"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Trophy, DollarSign, Activity, TrendingUp, UserPlus, ArrowUpRight } from "lucide-react"

export default function AdminDashboardPage() {
    console.log("Rendering AdminDashboardPage")
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Dashboard</h2>
                    <p className="text-gray-400 mt-2">Platform Overview & Metrics</p>
                </div>
                <div className="flex gap-3">
                    {/* Placeholder for potential date range picker or actions */}
                    <div className="bg-gray-900 text-xs font-bold px-4 py-2 rounded-lg text-gray-400 border border-gray-800">
                        Last 30 Days
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#1F2937] border-none text-white overflow-hidden relative group hover:ring-2 ring-green-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> +20% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1F2937] border-none text-white overflow-hidden relative group hover:ring-2 ring-yellow-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-300">Active Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold">15</div>
                        <p className="text-xs text-yellow-500/80 flex items-center gap-1 mt-1">
                            <ArrowUpRight className="w-3 h-3" /> +3 new today
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1F2937] border-none text-white overflow-hidden relative group hover:ring-2 ring-green-400/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-300">Platform Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold">₦450,000</div>
                        <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                            <TrendingUp className="w-3 h-3" /> +12% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-[#1F2937] border-none text-white overflow-hidden relative group hover:ring-2 ring-blue-500/20 transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-gray-300">Pool Value</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold">₦2.5M</div>
                        <p className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                            Currently in escrow
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <Card className="bg-[#111827] border-gray-800 text-white shadow-lg">
                    <CardHeader className="border-b border-gray-800">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-800">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                            {i % 2 === 0 ? <Trophy className="w-4 h-4 text-yellow-500" /> : <UserPlus className="w-4 h-4 text-green-500" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-200">{i % 2 === 0 ? "New Tournament Created" : "New User Registered"}</p>
                                            <p className="text-xs text-gray-500">2 minutes ago • <span className="text-gray-400">User00{i}</span></p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                        New
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Status */}
                <Card className="bg-[#111827] border-gray-800 text-white shadow-lg">
                    <CardHeader className="border-b border-gray-800">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                            Live Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Server Load</span>
                                <span className="text-green-500 font-bold">12%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[12%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Active Sessions</span>
                                <span className="text-blue-500 font-bold">843</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">System Health</span>
                                <span className="text-green-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                    <div key={i} className="h-8 flex-1 bg-green-500/20 rounded-sm first:rounded-l-lg last:rounded-r-lg"></div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
