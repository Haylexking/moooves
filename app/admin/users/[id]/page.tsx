"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    User,
    Trash2,
    Archive,
    Gamepad2,
    Trophy,
    Calendar,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    MoreVertical,
    ArrowUpRight
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

// --- MOCK DATA ---
const GAMES_PLAYED = Array.from({ length: 5 }).map((_, i) => ({
    id: `game-${i}`,
    type: i % 2 === 0 ? "1v1" : "Moove t001",
    subType: i % 2 === 0 ? "1v1 (computer)" : "Tournament",
    date: "10 Aug 2025",
    result: i === 0 ? "Won" : "Left",
    amount: i === 0 ? "2,000" : null,
    points: i % 2 !== 0 ? "30 points" : null,
    players: i % 2 !== 0 ? "50/100" : "1 player",
    icon: i % 2 === 0 ? Gamepad2 : Trophy
}))

const ACTIVITIES = [
    { id: 1, type: "message", text: "I have been trying to...", time: "2hrs ago", user: "User 001", action: "Reply" },
    { id: 2, type: "message", text: "Had issues with crea...", time: "21d ago", user: "User 001", action: "Replied" },
]

export default function AdminUserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const [isDeactivated, setIsDeactivated] = useState(false)

    useEffect(() => {
        // In real app: fetch user details
        setTimeout(() => {
            setLoading(false)
        }, 1000)
    }, [])

    const handleDeactivate = () => {
        setIsDeactivated(!isDeactivated)
        toast.success(isDeactivated ? "Account activated successfully" : "Account deactivated successfully")
    }

    const handleDelete = () => {
        if (confirm("Are you sure you want to permanently delete this account?")) {
            toast.success("Account deleted successfully")
            router.push("/admin/users")
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">

            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-gray-500 mb-6 font-medium text-sm md:text-base">
                <Link href="/admin/users"><ChevronLeft className="w-5 h-5 cursor-pointer" /></Link>
                <Link href="/admin/users" className="hover:text-gray-900 dark:hover:text-gray-300">Players</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 dark:text-white font-bold">User 001</span>
            </div>

            {/* HEADER SECTION (Metric Cards grid + Profile) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* PROFILE CARD */}
                <Card className="bg-white dark:bg-gray-900 border-none shadow-sm lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                <User className="w-8 h-8" />
                            </div>
                            <Badge variant={isDeactivated ? "destructive" : "default"} className={cn("px-2 py-1 rounded text-xs font-bold", isDeactivated ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-50 text-green-600 hover:bg-green-100")}>
                                {isDeactivated ? "Inactive" : "Active"}
                            </Badge>
                        </div>

                        <h2 className="text-2xl font-bold dark:text-white">User 001</h2>
                        <p className="text-sm text-gray-500">User001@gmail.com</p>
                        <p className="text-xs text-gray-400 mt-1">Joined: 30th Aug, 2025</p>

                        <div className="flex gap-3 mt-6 flex-wrap">
                            <Button
                                variant="outline"
                                className="flex-1 border-gray-200 text-gray-600 dark:text-gray-300 h-9 text-xs whitespace-nowrap"
                                onClick={handleDeactivate}
                            >
                                {isDeactivated ? "Activate account" : "Deactivate account"}
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs whitespace-nowrap"
                                onClick={handleDelete}
                            >
                                Delete account
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* METRICS ROW (3 cols wide) */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Balance */}
                    <Card className="bg-[#343B4A] border-none text-white flex flex-col justify-between">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total balance</p>
                                <h3 className="text-2xl font-bold mt-1 break-words">₦2,000,000</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Game Hosted */}
                    <Card className="bg-[#D1E9D2] border-none text-[#002B03]">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-green-800" />
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-80">Game hosted</p>
                                <h3 className="text-2xl font-bold mt-1">010</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Game Participated */}
                    <Card className="bg-[#D1E9D2] border-none text-[#002B03]">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5 text-green-800" />
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-80">Game Participated</p>
                                <h3 className="text-2xl font-bold mt-1">100</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Game Won */}
                    <Card className="bg-[#FFF4C8] border-none text-[#6B5A00]">
                        <CardContent className="p-6 h-full flex flex-col justify-between">
                            <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-80">Game won</p>
                                <h3 className="text-2xl font-bold mt-1">005</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* LEFT: Recent Activities Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-white dark:bg-gray-900 border-none shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold dark:text-white">Recent activities</h3>
                                <div className="flex gap-2 text-gray-400">
                                    <Filter className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                                    <MoreVertical className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>

                            {/* Activities List */}
                            <div className="space-y-3">
                                {ACTIVITIES.map(act => (
                                    <div key={act.id} className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                                                <MessageSquare className="w-3 h-3 text-green-600" />
                                                Message
                                            </div>
                                            <span className="text-[10px] text-gray-400">{act.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium my-2">{act.text}</p>
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                variant={act.action === "Reply" ? "default" : "outline"}
                                                className={cn("h-7 text-xs px-4", act.action === "Reply" ? "bg-green-200 text-green-800 hover:bg-green-300 border-none" : "bg-gray-100 border-none text-gray-500")}
                                                onClick={() => act.action === "Reply" && toast.info("Reply feature coming to user profile soon")}
                                            >
                                                {act.action}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Games Played List */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-1 relative overflow-hidden">
                        <div className="flex justify-between items-center p-4">
                            <h3 className="font-bold text-lg dark:text-white">Games played</h3>
                            <div className="flex gap-2 text-gray-400">
                                <Filter className="w-5 h-5 cursor-pointer hover:text-gray-600" onClick={() => setShowFilters(!showFilters)} />
                                <MoreVertical className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>

                        {showFilters && (
                            <div className="absolute top-12 right-4 z-20 w-72 bg-white dark:bg-gray-950 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center"><h4 className="font-bold">Filters</h4><X className="w-4 h-4 cursor-pointer hover:text-red-500" onClick={() => setShowFilters(false)} /></div>
                                {/* Filter content... (Simulated same as before) */}
                                <div className="space-y-4">
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowFilters(false)}>Reset</Button>
                                        <Button size="sm" className="flex-1 bg-green-700 text-white">Apply</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TABLE HEADER (Desktop) */}
                        <div className="hidden md:grid bg-gray-50 dark:bg-gray-950/50 p-3 rounded-lg grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 text-xs font-bold text-gray-400 mb-2">
                            <div className="w-8"></div>
                            <div>Game type</div>
                            <div>Participants/Score</div>
                            <div>Date</div>
                            <div className="text-right">Action</div>
                        </div>

                        {/* TABLE ROWS */}
                        <div className="space-y-2 px-2 pb-4">
                            {GAMES_PLAYED.map(game => (
                                <div key={game.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-center p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group">
                                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 items-center justify-center text-gray-500">
                                        <game.icon className="w-4 h-4" />
                                    </div>

                                    {/* Mobile View Structure */}
                                    <div className="flex justify-between items-center md:hidden w-full mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                <game.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm dark:text-gray-200">{game.type}</p>
                                                <p className="text-xs text-gray-400">{game.subType}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {game.amount ? (
                                                <p className="font-bold text-sm dark:text-gray-200">₦{game.amount}</p>
                                            ) : (
                                                <p className="font-bold text-sm dark:text-gray-200">{game.points}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop View Columns */}
                                    <div className="hidden md:block">
                                        <p className="font-bold text-sm dark:text-gray-200">{game.type}</p>
                                        <p className="text-xs text-gray-400">{game.subType}</p>
                                    </div>

                                    <div className="hidden md:block">
                                        {game.amount ? (
                                            <p className="font-bold text-sm dark:text-gray-200">₦{game.amount}</p>
                                        ) : (
                                            <p className="font-bold text-sm dark:text-gray-200">{game.points}</p>
                                        )}
                                        <p className="text-xs text-gray-400">{game.players}</p>
                                    </div>

                                    <div className="flex justify-between md:block items-center">
                                        <span className="md:hidden text-xs text-gray-400">{game.players} • {game.date}</span>
                                        <span className="hidden md:block text-sm dark:text-gray-400">{game.date}</span>
                                        <Button size="sm" className="h-7 text-xs bg-[#344035] text-white hover:bg-[#253026]">View</Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between px-4 pb-4">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next <ChevronRight className="w-3 h-3 ml-1" /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
