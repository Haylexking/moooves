"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Link as LinkIcon,
    ChevronLeft,
    ChevronRight,
    Plus
} from "lucide-react"
import Link from "next/link"

export default function AdminEditFAQPage() {
    const [faqs, setFaqs] = useState([
        { id: 1, question: "How do I join a tournament?", answer: "Simply select an available tournament, pay the entry fee, and you'll be added to the participants list.", selected: false },
        { id: 2, question: "What is the minimum entry fee?", answer: "The host sets the entry fee, but it must be at least ₦1,000 per player", selected: false },
        { id: 3, question: "How is the prize pool shared?", answer: "", selected: false },
    ])

    const toggleSelect = (id: number) => {
        setFaqs(faqs.map(f => f.id === id ? { ...f, selected: !f.selected } : f))
    }

    const handleAddBox = () => {
        const newId = faqs.length > 0 ? Math.max(...faqs.map(f => f.id)) + 1 : 1
        setFaqs([...faqs, { id: newId, question: "New Question", answer: "", selected: false }])
    }

    const handleDeleteBox = () => {
        setFaqs(faqs.filter(f => !f.selected))
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            {/* Breadcrumb Header */}
            <div className="flex items-center gap-2 text-xl font-medium text-gray-500 mb-6">
                <Link href="/admin/faq"><ChevronLeft className="w-6 h-6 text-gray-900 dark:text-gray-100 cursor-pointer" /></Link>
                <span className="text-gray-500">FAQ/Support</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100 font-bold">Edit FAQ</span>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-900 min-h-[600px] rounded-2xl">

                {/* Toolbar */}
                <div className="p-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><Bold className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><Italic className="w-4 h-4" /></Button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><AlignLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><AlignCenter className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><AlignRight className="w-4 h-4" /></Button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><List className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><ListOrdered className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black"><LinkIcon className="w-4 h-4" /></Button>
                </div>

                <CardContent className="p-8 space-y-6">

                    {faqs.map((faq) => (
                        <div key={faq.id} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/20 rounded-xl relative group">
                            <div className="absolute right-4 top-4">
                                <Checkbox
                                    className="border-gray-300 w-5 h-5 data-[state=checked]:bg-[#468549] data-[state=checked]:border-[#468549]"
                                    checked={faq.selected}
                                    onCheckedChange={() => toggleSelect(faq.id)}
                                />
                            </div>

                            {/* Question Input */}
                            <div className="flex items-center bg-[#E5E7EB] dark:bg-gray-800 rounded-lg pr-12 overflow-hidden">
                                <div className="h-12 w-12 flex items-center justify-center shrink-0">
                                    <Plus className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    value={faq.question}
                                    className="bg-transparent border-none outline-none h-12 w-full font-bold text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                                    placeholder="Type question here..."
                                    readOnly // Since simple mock
                                />
                            </div>

                            {/* Answer Input */}
                            {faq.answer && (
                                <div className="bg-[#E5E7EB] dark:bg-gray-800 rounded-lg p-4 ml-0">
                                    <p className="font-medium text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}

                            {/* Detailed Answer Box for the one with list (simulated) */}
                            {faq.id === 3 && (
                                <div className="bg-[#E5E7EB] dark:bg-gray-800 rounded-lg p-4 ml-0 space-y-1">
                                    <p className="font-medium text-gray-600 dark:text-gray-300 text-sm">• Host: 50% of the pool</p>
                                    <p className="font-medium text-gray-600 dark:text-gray-300 text-sm">• Winners (Top 3): 40% (1st: 20%, 2nd: 12%, 3rd: 8%)</p>
                                    <p className="font-medium text-gray-600 dark:text-gray-300 text-sm">• Platform: 10% (service fee)</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-8">
                        <div className="flex gap-4">
                            <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold" onClick={handleAddBox}>Add box</Button>
                            <Button variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold" onClick={handleDeleteBox}>Delete box</Button>
                        </div>

                        <Button className="bg-[#468549] hover:bg-[#386b3a] text-white font-bold px-8">Save & update</Button>
                    </div>

                </CardContent>
            </Card>

        </div>
    )
}
