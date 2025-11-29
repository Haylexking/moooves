"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Maximize2, Minimize2 } from "lucide-react"
import { useGameStore } from "@/lib/stores/game-store"
import { cn } from "@/lib/utils"

interface MobileControlsProps {
    onPlace: () => void
    disabled?: boolean
    playerSymbol: "X" | "O"
}

export function MobileControls({ onPlace, disabled, playerSymbol }: MobileControlsProps) {
    const moveCursor = useGameStore((state) => state.moveCursor)
    const [isExpanded, setIsExpanded] = useState(true)

    if (!isExpanded) {
        return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-2 rounded-full bg-[#1a1b26]/90 backdrop-blur-xl border border-white/10 shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-12 h-12 bg-[#2f334d] hover:bg-[#3b4261] rounded-full flex items-center justify-center text-white transition-all active:scale-95 shadow-md border border-white/5"
                >
                    <Maximize2 className="w-6 h-6" />
                </button>

                <div className="w-px h-6 bg-white/10" />

                <button
                    onClick={onPlace}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all active:scale-95 shadow-md border border-white/5",
                        disabled
                            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-500"
                    )}
                >
                    <X className="w-6 h-6 stroke-[3]" />
                </button>
            </div>
        )
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 p-4 rounded-[32px] bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header / Collapse */}
            <div className="w-full flex justify-between items-center px-2 mb-2">
                <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Controls</div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <Minimize2 className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* D-Pad */}
                <div className="relative w-32 h-32 bg-[#24283b] rounded-full p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-white/5">
                    {/* Inner circle for depth */}
                    <div className="absolute inset-3 rounded-full bg-[#1a1b26] shadow-inner" />

                    {/* Up */}
                    <button
                        onClick={() => moveCursor(-1, 0)}
                        className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#2f334d] hover:bg-[#3b4261] active:bg-blue-600 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 border-b-2 border-[#1a1b26] active:border-none"
                        aria-label="Move Up"
                    >
                        <ArrowUp className="w-5 h-5 text-gray-300" />
                    </button>
                    {/* Down */}
                    <button
                        onClick={() => moveCursor(1, 0)}
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#2f334d] hover:bg-[#3b4261] active:bg-blue-600 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 border-b-2 border-[#1a1b26] active:border-none"
                        aria-label="Move Down"
                    >
                        <ArrowDown className="w-5 h-5 text-gray-300" />
                    </button>
                    {/* Left */}
                    <button
                        onClick={() => moveCursor(0, -1)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#2f334d] hover:bg-[#3b4261] active:bg-blue-600 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 border-b-2 border-[#1a1b26] active:border-none"
                        aria-label="Move Left"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
                    </button>
                    {/* Right */}
                    <button
                        onClick={() => moveCursor(0, 1)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#2f334d] hover:bg-[#3b4261] active:bg-blue-600 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 border-b-2 border-[#1a1b26] active:border-none"
                        aria-label="Move Right"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-300" />
                    </button>

                    {/* Center decorative dot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#1a1b26] rounded-full border border-white/5 shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                {/* Place Button */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action</span>
                    <button
                        onClick={onPlace}
                        disabled={disabled}
                        className={cn(
                            "w-20 h-20 rounded-2xl font-black text-xl tracking-wider uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center border-b-4 active:border-b-0 active:translate-y-1",
                            disabled
                                ? "bg-gray-800 text-gray-600 border-gray-900 cursor-not-allowed"
                                : "bg-green-500 text-white border-green-700 hover:bg-green-400 shadow-green-500/20"
                        )}
                    >
                        <X className="w-10 h-10 stroke-[3]" />
                    </button>
                </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono">
                Position: [15, 15]
            </div>
        </div>
    )
}
