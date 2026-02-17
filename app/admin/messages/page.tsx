"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    Filter,
    MoreVertical,
    User,
    CheckSquare,
    Square,
    Trash2,
    Settings2,
    Reply,
    ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WriteMessageModal } from "@/components/admin/write-message-modal"

// --- MOCK DATA ---
const MESSAGES = [
    {
        id: 1,
        user: "User002@gmail.com",
        date: "30 Aug, 2025",
        subject: "we are sorry",
        preview: "We sincerely apologize for the situation th...",
        read: false,
        selected: true,
        type: "ban",
        fullText: "We sincerely apologize for the situation that led to our account being banned.\nWe deeply regret any inconvenience or misunderstanding our actions may have caused. It was never our intention to go against the rules or disrupt the community.\n\nWe have taken time to carefully reflect on this, and we fully understand the importance of following all guidelines moving forward. Please be assured that we will handle things more responsibly and ensure such an issue never happens again.\n\nWe truly value being part of this community, and we are committed to rebuilding trust through positive and respectful participation. Thank you for considering our appeal, and we hope we can be given a second chance to prove ourselves."
    },
    {
        id: 2,
        user: "User002@gmail.com",
        date: "30 Aug, 2025",
        subject: "we are sorry",
        preview: "We sincerely apologize for the situation th...",
        read: true,
        selected: false,
        type: "ban"
    },
    {
        id: 3,
        user: "User002@gmail.com",
        date: "30 Aug, 2025",
        subject: "we are sorry",
        preview: "We sincerely apologize for the situation th...",
        read: true,
        selected: false,
        type: "ban"
    },
    {
        id: 4,
        user: "User002@gmail.com",
        date: "30 Aug, 2025",
        subject: "we are sorry",
        preview: "We sincerely apologize for the situation th...",
        read: true,
        selected: false,
        type: "ban"
    }
]

export default function AdminMessagesPage() {
    const [selectedMessage, setSelectedMessage] = useState<any>(MESSAGES[0])
    const [activeTab, setActiveTab] = useState<"all" | "replies">("all")
    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
    const [mobileView, setMobileView] = useState<"list" | "detail">("list")

    const handleMessageClick = (msg: any) => {
        setSelectedMessage(msg)
        setMobileView("detail")
    }

    return (
        <div className="p-4 md:p-6 h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] flex flex-col max-w-[1600px] mx-auto">
            <WriteMessageModal isOpen={isWriteModalOpen} onClose={() => setIsWriteModalOpen(false)} />

            {/* HEADER */}
            <div className={cn("flex justify-between items-center mb-6", mobileView === "detail" && "hidden md:flex")}>
                <h2 className="text-2xl font-bold dark:text-white">Messages</h2>
                <Button
                    className="bg-[#58A55C] hover:bg-[#468549] text-white"
                    onClick={() => setIsWriteModalOpen(true)}
                >
                    write a message
                </Button>
            </div>

            <div className="flex gap-6 flex-1 min-h-0 relative">
                {/* LEFT LIST PANEL */}
                <div className={cn(
                    "w-full lg:w-1/3 flex flex-col gap-4 min-w-[300px] transition-all",
                    mobileView === "detail" ? "hidden lg:flex" : "flex"
                )}>

                    <div className="flex justify-between items-center overflow-x-auto pb-2 md:pb-0">
                        <div className="flex gap-2">
                            <Badge
                                variant={activeTab === "all" ? "default" : "outline"}
                                className={cn("cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap", activeTab === "all" ? "bg-[#344035] hover:bg-[#253026]" : "bg-gray-100 dark:bg-gray-900 border-none text-gray-500")}
                                onClick={() => setActiveTab("all")}
                            >
                                All messages
                            </Badge>
                            <Badge
                                variant={activeTab === "replies" ? "default" : "outline"}
                                className={cn("cursor-pointer px-4 py-1.5 rounded-full whitespace-nowrap", activeTab === "replies" ? "bg-[#344035] hover:bg-[#253026]" : "bg-gray-100 dark:bg-gray-900 border-none text-gray-500")}
                                onClick={() => setActiveTab("replies")}
                            >
                                Replies
                            </Badge>
                        </div>
                        <Settings2 className="w-5 h-5 text-gray-500 cursor-pointer shrink-0 ml-2" />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-20 md:pb-0">
                        {MESSAGES.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => handleMessageClick(msg)}
                                className={cn(
                                    "p-4 rounded-xl cursor-pointer transition-all border relative group",
                                    selectedMessage?.id === msg.id && mobileView !== "list"
                                        ? "bg-[#D1E9D2] border-[#AADDAA]"
                                        : "bg-gray-50 dark:bg-gray-900 border-transparent hover:bg-gray-100 dark:hover:bg-gray-800",
                                    !msg.read && "border-green-500/30 bg-green-50/50"
                                )}
                            >
                                <div className="absolute top-4 right-4">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-green-600 cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                </div>

                                <div className="flex justify-between items-start mb-1 pr-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">To: {msg.user}</p>
                                            {!msg.read && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                        </div>
                                        <p className="text-[10px] text-gray-500">{msg.date}</p>
                                    </div>
                                </div>

                                <h4 className="font-black text-gray-800 dark:text-gray-200 mt-3 text-sm">{msg.subject}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                    {msg.preview}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 pb-4 lg:pb-0">
                        <Button variant="outline" className="bg-white dark:bg-gray-900 text-gray-500 h-9">Clear all</Button>
                        <Button variant="outline" className="bg-gray-100 text-gray-400 border-none h-9" disabled>Delete</Button>
                    </div>
                </div>

                {/* RIGHT DETAIL PANEL */}
                <Card className={cn(
                    "flex-1 bg-white dark:bg-gray-900 border-none shadow-sm h-full flex flex-col transition-all",
                    mobileView === "list" ? "hidden lg:flex" : "flex absolute inset-0 z-10 lg:static"
                )}>
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                        {/* Mobile Back Button */}
                        <div className="lg:hidden mb-4">
                            <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => setMobileView("list")}>
                                <ArrowLeft className="w-5 h-5 mr-2" /> Back to messages
                            </Button>
                        </div>

                        {selectedMessage ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Sent to</p>
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedMessage.user}</h3>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">{selectedMessage.date}</span>
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                                    {selectedMessage.subject}
                                </h2>

                                <div className="flex-1 overflow-y-auto pr-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.fullText || selectedMessage.preview}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                    <Button
                                        className="bg-[#468549] hover:bg-[#386b3a] text-white px-6"
                                        onClick={() => setIsWriteModalOpen(true)}
                                    >
                                        Reply message
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Select a message to view details
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
