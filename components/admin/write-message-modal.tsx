"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    X,
    Send,
    ChevronDown,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Link as LinkIcon
} from "lucide-react"
import { useState } from "react"

interface WriteMessageModalProps {
    isOpen: boolean
    onClose: () => void
}

export function WriteMessageModal({ isOpen, onClose }: WriteMessageModalProps) {
    const [step, setStep] = useState<"compose" | "success">("compose")

    const handleSend = () => {
        // In real app: API call
        setStep("success")
        setTimeout(() => {
            setStep("compose")
            onClose()
        }, 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-gray-900 border-none rounded-2xl shadow-2xl">

                {step === "compose" ? (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="w-8"></div> {/* Spacer for centering if needed, or empty */}
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8 absolute right-4 top-4">
                                <X className="w-5 h-5 text-gray-500" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* TO Field */}
                            <div className="flex items-center">
                                <Label className="w-16 font-bold text-gray-700 dark:text-gray-300 text-sm uppercase">To:</Label>
                                <div className="flex-1 relative">
                                    <div className="bg-gray-50 dark:bg-gray-800 border-none h-10 flex items-center px-4 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200 justify-between cursor-pointer">
                                        User002@gmail.com
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* FROM Field */}
                            <div className="flex items-center">
                                <Label className="w-16 font-bold text-gray-700 dark:text-gray-300 text-sm uppercase">From:</Label>
                                <div className="flex-1">
                                    <div className="bg-gray-50 dark:bg-gray-800 border-none h-10 flex items-center px-4 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200">
                                        Admin@moooves.ng
                                    </div>
                                </div>
                            </div>

                            {/* Toolbar */}
                            <div className="flex items-center gap-1 pl-16 py-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><Bold className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><Italic className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><AlignLeft className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><AlignCenter className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><AlignRight className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><List className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><ListOrdered className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-black"><LinkIcon className="w-4 h-4" /></Button>
                            </div>

                            {/* Title Field */}
                            <div className="flex items-center">
                                <Label className="w-16 font-bold text-gray-700 dark:text-gray-300 text-sm uppercase">Title:</Label>
                                <div className="flex-1">
                                    <div className="bg-gray-50 dark:bg-gray-800 border-none h-10 flex items-center px-4 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200">
                                        User002@gmail.com
                                    </div>
                                </div>
                            </div>

                            {/* Text Area */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 min-h-[250px] shadow-sm">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We sincerely apologize for the situation that led to our account being banned.
                                    We deeply regret any inconvenience or misunderstanding our actions may have caused.
                                    It was never our intention to go against the rules or disrupt the community...
                                </p>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-between items-center pt-2">
                                <Button variant="secondary" className="bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 px-6 h-10 text-xs">Clear all</Button>
                                <Button
                                    className="bg-[#58A55C] hover:bg-[#468549] text-white font-bold rounded-lg px-6 h-10 text-xs shadow-lg shadow-green-900/10"
                                    onClick={handleSend}
                                >
                                    Send message
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-in zoom-in">
                            <Send className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold">Message sent</h3>
                        <p className="text-gray-500">Your message has been sent successfully.</p>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}
