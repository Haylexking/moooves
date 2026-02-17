"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Send,
    Wallet,
    ArrowRightLeft,
    CreditCard,
    User,
    Filter,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Banknote,
    Building2,
    X,
    Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SendFundModal } from "@/components/admin/send-fund-modal"

// --- MOCK DATA ---
const TRANSACTIONS = [
    { id: 1, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "fulfilled" },
    { id: 2, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "fulfilled" },
    { id: 3, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "fulfilled" },
    { id: 4, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "Done" },
    { id: 5, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "Done" },
    { id: 6, user: "User002", date: "10 Aug 2025, 2:30 AM", type: "Fund", amount: "N", status: "Done" },
]

export default function AdminFinancesPage() {
    const [showFilters, setShowFilters] = useState(false)
    const [isSendFundModalOpen, setIsSendFundModalOpen] = useState(false)

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
            <SendFundModal isOpen={isSendFundModalOpen} onClose={() => setIsSendFundModalOpen(false)} />

            <h2 className="text-2xl font-bold dark:text-white mb-6">Finance</h2>

            <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] xl:grid-cols-[400px_1fr] gap-8">

                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    {/* Total Balance Card */}
                    <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] rounded-3xl p-6 text-white relative overflow-hidden h-[200px] flex flex-col justify-between shadow-xl">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <Button size="sm" className="bg-[#58A55C] hover:bg-[#468549] text-white font-bold gap-2 px-4 rounded-lg" onClick={() => setIsSendFundModalOpen(true)}>
                                <Send className="w-3 h-3" /> Send
                            </Button>
                        </div>

                        <div>
                            <p className="text-sm text-gray-400 mb-1">Total balance</p>
                            <h3 className="text-3xl font-black tracking-tight">N3,000,000</h3>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Bank details</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Account NO</label>
                                <div className="relative">
                                    <Input placeholder="XXX XXX XXXX" className="h-12 pl-10 border-gray-300 bg-white text-sm font-medium" />
                                    <CreditCard className="w-4 h-4 absolute left-3 top-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Bank name</label>
                                <div className="relative">
                                    <Input placeholder="Access Bank NIG PLC" className="h-12 pl-10 border-gray-300 bg-white text-sm font-medium" />
                                    <Building2 className="w-4 h-4 absolute left-3 top-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Account Name</label>
                                <div className="relative">
                                    <Input placeholder="MOOOVES.NG" className="h-12 pl-10 border-gray-300 bg-white text-sm font-medium" />
                                    <User className="w-4 h-4 absolute left-3 top-4 text-gray-400" />
                                </div>
                            </div>

                            <Button className="w-full h-12 bg-[#3A6B3D] hover:bg-[#2e5530] text-white font-bold text-sm rounded-lg mt-2">
                                Update detail
                            </Button>
                        </div>
                    </div>

                    {/* Recent Top-ups */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 mt-8">Recent top-ups</h3>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">User 00{i}</p>
                                            <p className="text-[10px] text-gray-400">2hrs ago</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-[#468549]">N150,000</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* Revenue */}
                        <Card className="bg-[#343B4A] border-none text-white h-[120px]">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 mb-0.5">Revenue generated</p>
                                    <h3 className="text-xl font-black">N15,000</h3>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Funding */}
                        <Card className="bg-[#D1E9D2] border-none text-[#002B03] h-[120px]">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center mb-2">
                                    <Banknote className="w-4 h-4 text-green-800" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-70 mb-0.5">Tournment funding</p>
                                    <h3 className="text-xl font-black">N150,000</h3>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transferred */}
                        <Card className="bg-[#D1E9D2] border-none text-[#002B03] h-[120px]">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center mb-2">
                                    <ArrowRightLeft className="w-4 h-4 text-green-800" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-70 mb-0.5">Transferred in</p>
                                    <h3 className="text-xl font-black">N300,000</h3>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paid Out */}
                        <Card className="bg-[#D1DAE6] border-none text-[#1F2937] h-[120px]">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center mb-2">
                                    <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold opacity-70 mb-0.5">Paid out</p>
                                    <h3 className="text-xl font-black">N300,000</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment History Table & Filters */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 relative min-h-[600px]">

                        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Payment history</h3>

                            <div className="flex flex-wrap gap-2 relative">
                                <Button variant="ghost" className="bg-gray-100/50 rounded-full px-4 text-xs font-bold text-gray-500 h-8 hover:bg-gray-100">Funds per tournament</Button>
                                <Button variant="ghost" className="bg-gray-100/50 rounded-full px-4 text-xs font-bold text-gray-500 h-8 hover:bg-gray-100">Transactions</Button>
                                <Button variant="ghost" className="bg-[#468549] text-white rounded-full px-4 text-xs font-bold h-8 hover:bg-[#386b3a]">Payment request</Button>

                                <div className="flex gap-1 ml-auto md:ml-2 border-l border-gray-200 pl-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowFilters(!showFilters)}>
                                        <Filter className="w-4 h-4 text-gray-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </div>

                                {/* Filter Modal */}
                                {showFilters && (
                                    <div className="absolute top-10 right-0 z-20 w-80 bg-white dark:bg-gray-950 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 p-6 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-lg">Filters</h3>
                                            <button onClick={() => setShowFilters(false)}><X className="w-5 h-5 text-gray-500" /></button>
                                        </div>
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600">Player name</label>
                                                <div className="bg-gray-50 rounded-lg h-10 border border-transparent"></div>
                                            </div>
                                            <div className="flex items-center gap-3 pt-4">
                                                <Button variant="outline" className="flex-1 border-gray-200 text-gray-500 font-bold" onClick={() => setShowFilters(false)}>Reset</Button>
                                                <Button className="flex-1 bg-[#468549] hover:bg-[#386b3a] text-white font-bold">Apply filter</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table Header (Hidden on Mobile) */}
                        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr] gap-4 mb-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <div>Player Name</div>
                            <div>Status</div>
                            <div></div>
                        </div>

                        {/* Table Rows */}
                        <div className="space-y-2">
                            {TRANSACTIONS.map((tx) => (
                                <div key={tx.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-4 px-4 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                                    {/* Mobile Row */}
                                    <div className="flex md:contents justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{tx.user}</p>
                                                <p className="text-[10px] text-gray-400">{tx.date}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end md:hidden gap-1">
                                            <span className="text-sm font-bold text-indigo-600">
                                                {tx.status === "fulfilled" || tx.status === "Done" ? "Funded" : ""}
                                            </span>
                                            <Badge
                                                className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border-none",
                                                    tx.status === "fulfilled" ? "bg-[#343B4A] text-white" : "bg-[#EDF7ED] text-[#468549]"
                                                )}
                                            >
                                                {tx.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Desktop Columns */}
                                    <div className="hidden md:block text-sm font-bold text-indigo-600">
                                        {tx.status === "fulfilled" && "Funded wallet"}
                                        {tx.status === "Done" && "Funded wallet"}
                                    </div>

                                    <div className="hidden md:flex justify-end">
                                        <Badge
                                            className={cn(
                                                "rounded-lg px-4 py-1 text-[10px] font-bold uppercase tracking-wide border-none",
                                                tx.status === "fulfilled" ? "bg-[#343B4A] text-white hover:bg-[#2c3240]" : "bg-[#EDF7ED] text-[#468549] hover:bg-[#e0f0e0]"
                                            )}
                                        >
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Pagination */}
                        <div className="flex items-center justify-between mt-12">
                            <Button variant="outline" className="gap-2 pl-2 text-gray-500 border-gray-200 hover:bg-gray-50 bg-gray-50/50 h-9 text-xs font-bold">
                                <ChevronLeft className="w-3 h-3" /> Previous
                            </Button>

                            <Button size="sm" variant="outline" className="w-8 h-8 p-0 font-bold border-green-200 bg-green-50 text-green-800 text-xs">01</Button>

                            <Button variant="outline" className="gap-2 pr-2 text-gray-500 border-gray-200 hover:bg-gray-50 bg-gray-50/50 h-9 text-xs font-bold">
                                Next <ChevronRight className="w-3 h-3" />
                            </Button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}
