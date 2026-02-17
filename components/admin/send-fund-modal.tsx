"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, CreditCard } from "lucide-react"

interface SendFundModalProps {
    isOpen: boolean
    onClose: () => void
}

export function SendFundModal({ isOpen, onClose }: SendFundModalProps) {
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"input" | "success">("input")

    const handlePayment = () => {
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            setLoading(false)
            setStep("success")
            // Optionally close after a delay
            setTimeout(() => {
                setStep("input")
                onClose()
            }, 2000)
        }, 1500)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-6 overflow-hidden bg-white text-black rounded-3xl">
                {step === "input" ? (
                    <>
                        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <DialogTitle className="text-xl font-bold">Send fund</DialogTitle>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-8 h-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="account-number" className="text-sm font-medium text-gray-600">Account number</Label>
                                <Input id="account-number" placeholder="XXX XXX XXXX" className="bg-gray-50 border-gray-100 h-10" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-sm font-medium text-gray-600">Enter amount</Label>
                                    <Input id="amount" placeholder="₦300,000" className="bg-gray-50 border-gray-100 h-10 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-name" className="text-sm font-medium text-gray-600">Account name</Label>
                                    <Input id="account-name" placeholder="User 002" className="bg-gray-50 border-gray-100 h-10" />
                                </div>
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-100" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">OR</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full h-12 border-gray-200 text-gray-700 font-medium">
                                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                                Pay with card
                            </Button>

                            <Button
                                className="w-full h-12 bg-[#344035] hover:bg-[#253026] text-white font-bold rounded-lg text-lg"
                                onClick={handlePayment}
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Complete payment"}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="py-10 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-700">Payment Successful!</h3>
                        <p className="text-gray-500">Funds have been sent successfully.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
