"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { PlayerCard } from "@/components/admin/player-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Gamepad2,
    User,
    Trash2,
    Filter,
    X,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MoreVertical
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// --- MOCK DATA ---
const MOCK_USERS = Array.from({ length: 10 }).map((_, i) => ({
    id: `user-${i + 1}`,
    name: "User 001",
    joinedDate: "30th Aug, 2025",
    isDeleted: false
}))

const MOCK_DELETED_USERS = Array.from({ length: 5 }).map((_, i) => ({
    id: `del-${i + 1}`,
    name: "User 001",
    joinedDate: "30th Aug, 2025",
    isDeleted: true
}))

export default function AdminUsersPage() {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"players" | "deleted">("players")
    const [showFilters, setShowFilters] = useState(false)
    const [users, setUsers] = useState<any[]>([])

    // Load users (Mock for now to match UI exactness, or fetch real)
    useEffect(() => {
        // In real app: fetch from API
        setTimeout(() => {
            setUsers(MOCK_USERS)
            setLoading(false)
        }, 1000)
    }, [])

    const displayedUsers = activeTab === "players" ? MOCK_USERS : MOCK_DELETED_USERS

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold dark:text-white">Players</h2>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                        <span className="text-sm border-r border-gray-300 pr-2 mr-2 dark:text-gray-300">Today</span>
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Total Players */}
                <Card className="bg-[#343B4A] border-none text-white overflow-hidden h-[140px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total number of players</p>
                            <h3 className="text-3xl font-black mt-1">5,000</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* New Players */}
                <Card className="bg-[#D1E9D2] border-none text-[#002B03] h-[140px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                            <User className="w-5 h-5 text-green-800" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80">New players</p>
                            <h3 className="text-3xl font-black mt-1">100</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Deleted Accounts */}
                <Card className="bg-[#FFE4E4] border-none text-[#7A2E2E] h-[140px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium opacity-80">Deleted accounts</p>
                            <h3 className="text-3xl font-black mt-1">003</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABS & FILTERS */}
            <div className="flex justify-between items-center mt-8 relative">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("players")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            activeTab === "players" ? "bg-[#344035] text-white shadow" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Players
                    </button>
                    <button
                        onClick={() => setActiveTab("deleted")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            activeTab === "deleted" ? "bg-[#344035] text-white shadow" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Deleted accounts
                    </button>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                </div>

                {/* FILTER POPUP */}
                {showFilters && (
                    <div className="absolute top-12 right-0 z-20 w-80 bg-white dark:bg-gray-950 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <h4 className="text-lg font-bold">Filters</h4>
                            <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Player name</label>
                                <div className="flex items-center justify-between p-2 rounded-lg border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                    <span className="text-sm text-gray-400">Select player</span>
                                    <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Input className="pl-8 h-9 text-xs" />
                                        <Calendar className="w-3 h-3 absolute left-2.5 top-3 text-gray-400" />
                                    </div>
                                    <span>-</span>
                                    <div className="relative flex-1">
                                        <Input className="pl-8 h-9 text-xs" />
                                        <Calendar className="w-3 h-3 absolute left-2.5 top-3 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowFilters(false)}>Reset</Button>
                            <Button className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white">Apply filter</Button>
                        </div>
                    </div>
                )}
            </div>

            {/* PLAYERS GRID */}
            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayedUsers.map((user) => (
                        <PlayerCard key={user.id} user={user} />
                    ))}
                </div>
            )}

            {/* PAGINATION */}
            <div className="flex items-center justify-between pt-8">
                <Button variant="outline" className="text-gray-500 gap-2 pl-2.5">
                    <ChevronLeft className="w-4 h-4" /> Previous
                </Button>

                <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]">01</Button>
                    <Button size="icon" variant="ghost" className="text-gray-500">02</Button>
                    <Button size="icon" variant="ghost" className="text-gray-500">03</Button>
                    <Button size="icon" variant="ghost" className="text-gray-500">04</Button>
                    <Button size="icon" variant="ghost" className="text-gray-500">05</Button>
                </div>

                <Button variant="outline" className="text-gray-500 gap-2 pr-2.5">
                    Next <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

        </div>
    )
}
