"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    ChevronLeft,
    ChevronRight,
    User,
    CheckCircle2,
    Trophy,
    Award,
    Medal
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// --- MOCK DATA ---
const LEADERBOARD = [
    { id: 1, name: "User001", points: "30pt.", rank: 1 },
    { id: 2, name: "User010", points: "25pt.", rank: 2 },
    { id: 3, name: "User010", points: "20pt.", rank: 3 },
    { id: 4, name: "User010", points: "20pt.", rank: 3 },
    { id: 5, name: "User010", points: "20pt.", rank: 3 },
]

const PARTICIPANTS = Array.from({ length: 12 }).map((_, i) => ({
    id: i + 1,
    name: "User 001",
    isHost: i === 7, // Example host
    status: "active"
}))

export default function AdminTournamentDetailsPage({ params }: { params: { id: string } }) {
    const [matchView, setMatchView] = useState<"finals" | "knockout">("finals")

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xl font-medium text-gray-500">
                    <Link href="/admin/tournaments"><ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100 cursor-pointer" /></Link>
                    <span className="text-gray-500">Tournaments</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100 font-bold">Moove t001</span>
                </div>
                <Badge variant="secondary" className="bg-gray-200 text-gray-600 px-3 py-1 text-xs font-bold gap-2 hover:bg-gray-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Status : Completed
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    {/* Leaderboard */}
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                        <div className="p-6 pb-2">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Leader board</h3>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {LEADERBOARD.map((user, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {user.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                                            {user.rank === 2 && <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />}
                                            {user.rank === 3 && <Medal className="w-5 h-5 text-orange-700 fill-orange-700" />}
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{user.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.points}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Matches */}
                    <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Matches</h3>

                            <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                                    <span>User001</span>
                                    <span className="text-gray-300">VS</span>
                                    <span>User001</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-6">
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-gray-50 border-gray-200" onClick={() => setMatchView(matchView === "finals" ? "knockout" : "finals")}>
                                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                                </Button>
                                <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{matchView === "finals" ? "Finals" : "Knock-out"}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-gray-50 border-gray-200" onClick={() => setMatchView(matchView === "finals" ? "knockout" : "finals")}>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl h-fit">
                    <CardContent className="p-8">

                        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Participants</h3>
                            <div className="flex gap-6 text-xs font-bold text-gray-500">
                                <span>Players : 50</span>
                                <span>Entry Fee : ₦3,000</span>
                                <span className="text-gray-900 dark:text-gray-100">Funds: ₦100,000</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {PARTICIPANTS.map((user) => (
                                <div key={user.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 flex flex-col items-center relative group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100">
                                    {/* Host Badge */}
                                    {user.isHost && (
                                        <span className="absolute top-4 right-4 text-[10px] font-bold text-gray-400">Host</span>
                                    )}

                                    {/* Rank Badge Placeholder (just decorative per screenshot) */}
                                    <div className="absolute top-4 left-4">
                                        <Award className="w-5 h-5 text-green-700 fill-green-700" />
                                    </div>

                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-500">
                                        <User className="w-8 h-8" />
                                    </div>

                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">{user.name}</h4>

                                    <Button variant="outline" className="w-full text-xs h-9 bg-gray-50 border-gray-200 text-gray-500 hover:bg-[#344035] hover:text-white transition-colors">
                                        View profile
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-12">
                            <Button variant="outline" className="gap-2 pl-2 text-gray-500 border-gray-200 hover:bg-gray-50 bg-gray-50/50">
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </Button>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="w-9 h-9 p-0 font-bold border-green-200 bg-green-50 text-green-800">01</Button>
                                <Button size="sm" variant="ghost" className="w-9 h-9 p-0 text-gray-400 font-bold border border-gray-100">02</Button>
                                <Button size="sm" variant="ghost" className="w-9 h-9 p-0 text-gray-400 font-bold border border-gray-100">03</Button>
                                <Button size="sm" variant="ghost" className="w-9 h-9 p-0 text-gray-400 font-bold border border-gray-100">04</Button>
                                <Button size="sm" variant="ghost" className="w-9 h-9 p-0 text-gray-400 font-bold border border-gray-100">05</Button>
                            </div>

                            <Button variant="outline" className="gap-2 pr-2 text-gray-500 border-gray-200 hover:bg-gray-50 bg-gray-50/50">
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
