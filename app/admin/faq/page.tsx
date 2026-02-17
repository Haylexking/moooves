"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function AdminFAQPage() {
    const [activeTab, setActiveTab] = useState<"faq" | "support">("faq")

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">

            <h2 className="text-2xl font-bold dark:text-white mb-6">FAQ/Support</h2>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-900 min-h-[600px] rounded-2xl">
                <CardContent className="p-8">

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        <button
                            onClick={() => setActiveTab("faq")}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                activeTab === "faq" ? "bg-[#344035] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                        >
                            Frequently asked question
                        </button>
                        <button
                            onClick={() => setActiveTab("support")}
                            className={cn(
                                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                                activeTab === "support" ? "bg-[#344035] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            )}
                        >
                            Support
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === "faq" ? (
                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                <AccordionItem value="item-1" className="border-none bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 font-bold text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center gap-3">
                                            <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                                            How do I join a tournament?
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-500 pb-4 pl-7 font-medium leading-relaxed">
                                        Simply select an available tournament, pay the entry fee, and you'll be added to the participants list.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2" className="border-none bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 font-bold text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center gap-3">
                                            <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                                            What is the minimum entry fee?
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-500 pb-4 pl-7 font-medium leading-relaxed">
                                        The host sets the entry fee, but it must be at least ₦1,000 per player
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3" className="border-none bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                                    <AccordionTrigger className="hover:no-underline py-4 font-bold text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center gap-3">
                                            <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                                            How is the prize pool shared?
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-500 pb-4 pl-7 font-medium leading-relaxed space-y-1">
                                        <p>• Host: 50% of the pool</p>
                                        <p>• Winners (Top 3): 40% (1st: 20%, 2nd: 12%, 3rd: 8%)</p>
                                        <p>• Platform: 10% (service fee)</p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="flex justify-end mt-8">
                                <Link href="/admin/faq/edit">
                                    <Button variant="outline" className="font-bold border-gray-200 text-gray-600 hover:bg-gray-50">Edit FAQ</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="glass-panel p-6 rounded-xl">
                                <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                                    Email Support: <span className="text-gray-500 font-medium">Reach us at support@[yourapp].com for detailed assistance.</span>
                                </p>
                                <p className="font-bold text-gray-800 dark:text-gray-200">
                                    FAQs: <span className="text-gray-500 font-medium">Browse our Frequently Asked Questions for instant solutions.</span>
                                </p>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

        </div>
    )
}
