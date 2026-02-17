"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Link as LinkIcon,
    ChevronRight,
    ChevronLeft
} from "lucide-react"
import Link from "next/link"

export default function AdminRulesPage() {
    // Initial content based on screenshot
    const [content, setContent] = useState(`Entry Fee
• The tournament host sets the entry fee.
• Minimum entry fee per player: ₦1,000.

Tournament Size
• Minimum number of players: 6
• Maximum number of players: 50

Minimum Prize Pool
• Total entry fees must generate a minimum prize pool of ₦100,000.
• The system will automatically calculate and notify if the entry fee and players count meet this requirement.

Prize Pool Distribution
• 10% of the total prize pool is automatically taken by the platform.
The remaining 90% is split as follows:
• Host: 50%
• Top 3 Players: 40%, divided as:
• 1st Place: 20%
• 2nd Place: 12%
• 3rd Place: 8%`)

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xl font-medium text-gray-500">
                <Link href="/admin"><ChevronLeft className="w-6 h-6 text-gray-400 cursor-pointer" /></Link>
                <span className="text-gray-500">Rules</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100 font-bold">Edit text</span>
            </div>

            {/* Editor Container */}
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900 min-h-[600px] flex flex-col">
                {/* Toolbar */}
                <div className="p-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Bold className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Italic className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Underline className="w-4 h-4" /></Button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><AlignLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><AlignCenter className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><AlignRight className="w-4 h-4" /></Button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><List className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><ListOrdered className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><LinkIcon className="w-4 h-4" /></Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6">
                    <textarea
                        className="w-full h-full resize-none outline-none border-none text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium bg-transparent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <Button variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">clear all</Button>
                    <Button className="bg-[#468549] hover:bg-[#386b3a] text-white px-8 font-bold">Save & update</Button>
                </div>
            </Card>

        </div>
    )
}
