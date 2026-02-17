"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Bell,
    Trash2,
    DollarSign,
    User,
    Trophy,
    Mail,
    MoreVertical
} from "lucide-react"
import { cn } from "@/lib/utils"

const NOTIFICATIONS = [
    {
        id: 1,
        type: "fund_request",
        title: "Fund request: N300,000",
        time: "2 hours ago",
        text: "User 002 requested for fund, Acct details: XXX XXX XXXX (John Doe) (Access Bank Nig.plc)",
        action: "Pay now"
    },
    {
        id: 2,
        type: "banned",
        title: "Account was banned",
        time: "2 hours ago",
        text: "User 002 sent you an email.",
        action: "Reply"
    },
    {
        id: 3,
        type: "tournament",
        title: "User 002 start a tournament",
        time: "2 hours ago",
        text: "User 002 has started a new tournament 'Moove t001'.",
        action: "View"
    },
    {
        id: 4,
        type: "deleted",
        title: "User 002 Deleted Account",
        time: "2 hours ago",
        text: "User 002 has deleted his moooves account and will no longer continue with us",
        action: null
    }
]

export function NotificationPanel({ onClose }: { onClose: () => void }) {
    return (
        <Card className="w-[400px] border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-gray-900 z-50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center text-gray-900 dark:text-gray-100">
                <h3 className="text-lg font-bold">Notifications</h3>
                {/* Close button handled by parent Popover usually, but added for safety */}
            </div>

            <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-2">
                    {NOTIFICATIONS.map((notif) => (
                        <div key={notif.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl relative group hover:bg-white border border-transparent hover:border-gray-100 transition-all">
                            <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1">
                                    {notif.type === "fund_request" && (
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                    {notif.type === "banned" && (
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                    {notif.type === "tournament" && (
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-gray-600" />
                                        </div>
                                    )}
                                    {notif.type === "deleted" && (
                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 pr-6">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{notif.title}</h4>
                                    <p className="text-[10px] text-gray-400 mb-2">{notif.time}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                                        {notif.text}
                                    </p>

                                    {notif.action && (
                                        <div className="flex justify-end">
                                            <Button size="sm" className={cn(
                                                "h-7 text-xs px-4",
                                                notif.action === "Pay now" ? "bg-[#468549] hover:bg-[#386b3a] text-white" :
                                                    notif.action === "Reply" ? "bg-[#468549] hover:bg-[#386b3a] text-white" :
                                                        "bg-[#468549] hover:bg-[#386b3a] text-white"
                                            )}>
                                                {notif.action}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end">
                <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-600 text-xs h-8">
                    Clear all
                </Button>
            </div>
        </Card>
    )
}
