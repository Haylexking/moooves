"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Trophy,
    Wallet,
    CheckCircle2,
    DollarSign,
    Calendar,
    MoreVertical,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    User,
    Search
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { toast } from "sonner"

// --- MOCK DATA ---
const TOURNAMENTS = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    name: "Moove t001",
    participants: "50 Players",
    date: "14 Aug 2025, 2:20 AM",
    status: "ongoing"
}))

export default function AdminTournamentsPage() {
    const [activeTab, setActiveTab] = useState<"ongoing" | "pending" | "completed">("ongoing")
    const [showFilters, setShowFilters] = useState(false)

    const handleDecline = (id: number) => {
        // In a real app, you might want a reason modal here
        if (confirm("Are you sure you want to decline this tournament? This action cannot be undone.")) {
            toast.success("Tournament declined successfully")
            // refresh data
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Tournaments</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                        <span className="text-sm border-r border-gray-300 pr-2 mr-2 dark:text-gray-300">Today</span>
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Entry Fee */}
                <Card className="bg-[#343B4A] border-none text-white overflow-hidden h-[150px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full relative">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-400" />
                            </div>
                            <Button size="sm" className="h-6 text-[10px] bg-[#468549] hover:bg-[#386b3a] text-white px-2">Change fee</Button>
                        </div>
                        <div>
                            <p className="text-xs text-gray-300 mb-1">Minimum entry<br />fee per tournament</p>
                            <h3 className="text-2xl font-black">₦2000</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Created */}
                <Card className="bg-[#D1E9D2] border-none text-[#002B03] h-[150px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-green-800" />
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-80 mb-1">Number of<br />tournaments created</p>
                            <h3 className="text-2xl font-black">010</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Fund */}
                <Card className="bg-[#D1E9D2] border-none text-[#002B03] h-[150px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-green-800" />
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-80 mb-1">Average fund<br />per tournament</p>
                            <h3 className="text-2xl font-black">₦102,000</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* Completed */}
                <Card className="bg-[#D1DAE6] border-none text-[#1F2937] h-[150px]">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-medium opacity-80 mb-1">Number of<br />tournaments completed</p>
                            <h3 className="text-2xl font-black">003</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 md:p-6 relative min-h-[500px]">
                <div className="flex flex-col md:flex-row gap-4 mb-6 relative">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex flex-col sm:flex-row w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab("ongoing")}
                            className={cn("px-4 md:px-6 py-2 rounded-lg md:rounded-full text-sm font-bold transition-all", activeTab === "ongoing" ? "bg-[#486D49] text-white shadow-md" : "text-gray-500 hover:text-gray-900")}
                        >
                            Ongoing tournament
                        </button>
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={cn("px-4 md:px-6 py-2 rounded-lg md:rounded-full text-sm font-bold transition-all", activeTab === "pending" ? "bg-[#486D49] text-white shadow-md" : "text-gray-500 hover:text-gray-900")}
                        >
                            Pending tournament
                        </button>
                        <button
                            onClick={() => setActiveTab("completed")}
                            className={cn("px-4 md:px-6 py-2 rounded-lg md:rounded-full text-sm font-bold transition-all", activeTab === "completed" ? "bg-[#486D49] text-white shadow-md" : "text-gray-500 hover:text-gray-900")}
                        >
                            Completed tournament
                        </button>
                    </div>

                    <div className="ml-auto flex gap-2 self-end md:self-auto">
                        <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Filter Modal */}
                    {showFilters && (
                        <div className="absolute top-12 right-0 z-20 w-full md:w-80 bg-white dark:bg-gray-950 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 p-6 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Filters</h3>
                                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-gray-500" /></button>
                            </div>
                            {/* Filter content retained from previous (simplified for brevity of prompt interaction if needed, but keeping full here) */}
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Tournament</label>
                                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg h-10 flex items-center justify-between px-3 cursor-pointer">
                                        <span className="text-sm text-gray-400">Select...</span>
                                        <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold">Funds generated</label>
                                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg h-10 flex items-center px-3">
                                        <span className="text-sm font-bold">N</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <Button variant="outline" className="flex-1 border-gray-200" onClick={() => setShowFilters(false)}>Reset</Button>
                                    <Button className="flex-1 bg-[#468549] hover:bg-[#386b3a] text-white font-bold">Apply filter</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* List Header (Hidden on Mobile) */}
                <div className="hidden md:grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 bg-[#EEF2EF] dark:bg-gray-800 rounded-lg mb-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">Tournament Name <MoreVertical className="w-3 h-3 rotate-90" /></div>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">Participants <MoreVertical className="w-3 h-3 rotate-90" /></div>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">Date <MoreVertical className="w-3 h-3 rotate-90" /></div>
                    <div className="w-[80px]"></div>
                </div>

                {/* List Items */}
                <div className="space-y-2">
                    {TOURNAMENTS.map((t) => (
                        <div key={t.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-4 border-b border-gray-50 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            {/* Mobile First: Flex row for Name */}
                            <div className="flex items-center justify-between md:justify-start gap-3 w-full">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{t.name}</span>
                                </div>
                                {/* Show Action button on mobile row right side */}
                                <div className="md:hidden">
                                    {activeTab === "pending" ? (
                                        <Button size="sm" className="h-7 text-xs bg-[#9F2D2D] hover:bg-[#7a2222] text-white px-4 font-bold rounded-lg shadow-sm">Decline</Button>
                                    ) : (
                                        <Link href={`/admin/tournaments/${t.id}`}>
                                            <Button size="sm" className="h-7 text-xs bg-[#344035] hover:bg-[#253026] text-white px-4">View</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Mobile: Detailed info below */}
                            <div className="flex justify-between md:contents text-sm">
                                <span className="font-bold text-gray-800 dark:text-gray-200 md:text-left">
                                    <span className="md:hidden text-gray-500 font-normal mr-2">Players:</span>
                                    {t.participants}
                                </span>
                                <span className="font-bold text-gray-800 dark:text-gray-200 md:text-left">
                                    <span className="md:hidden text-gray-500 font-normal mr-2">Date:</span>
                                    {t.date}
                                </span>
                            </div>

                            {/* Desktop: Action Button column */}
                            <div className="hidden md:flex justify-end w-[80px]">
                                {activeTab === "pending" ? (
                                    <Button size="sm" className="h-7 text-xs bg-[#9F2D2D] hover:bg-[#7a2222] text-white px-4 font-bold rounded-lg shadow-sm">Decline</Button>
                                ) : (
                                    <Link href={`/admin/tournaments/${t.id}`}>
                                        <Button size="sm" className="h-7 text-xs bg-[#344035] hover:bg-[#253026] text-white px-4">View</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-8 md:px-8">
                    <Button variant="outline" className="gap-2 pl-2 text-gray-500 border-gray-200 hover:bg-gray-50">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>

                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="w-10 h-10 p-0 font-bold border-green-200 bg-green-50 text-green-800">01</Button>
                        <Button size="sm" variant="ghost" className="hidden md:flex w-10 h-10 p-0 text-gray-400 font-bold items-center justify-center">02</Button>
                    </div>

                    <Button variant="outline" className="gap-2 pr-2 text-gray-500 border-gray-200 hover:bg-gray-50">
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

            </div>

        </div>
    )
}
