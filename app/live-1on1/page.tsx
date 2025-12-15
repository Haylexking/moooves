"use client"

import { LiveMatch } from "@/components/game/live-match"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function LiveMatchPage() {
    const { user } = useAuthStore()

    return (
        <div className="flex min-h-screen bg-black">
            <GlobalSidebar showTrigger={false} />
            <TopNavigation username={user?.fullName || user?.email || "Player"} />

            {/* Background */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/background.png"
                    alt="Background"
                    fill
                    className="object-cover object-center opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
            </div>

            {/* Back Button - Desktop Only */}
            <div className="hidden md:block fixed top-28 right-8 z-20">
                <a
                    href="/dashboard"
                    className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full transition-all border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Back to Dashboard</span>
                </a>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full pt-20">
                <div className="mb-8 text-center space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg italic tracking-tight">
                        1-on-1 <span className="text-green-500">LIVE</span>
                    </h1>
                    <p className="text-white/70 max-w-md mx-auto">
                        Create a match code or join a friend instantly. No hassle, just play.
                    </p>
                </div>

                <LiveMatch />
            </main>
        </div>
    )
}
