"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { motion } from "framer-motion"
import { Trophy, Gamepad2 } from "lucide-react"

export function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const handleRoleSelection = (role: "host" | "player") => {
    if (isAuthenticated) {
      if (role === "host") router.push("/dashboard")
      if (role === "player") router.push("/join")
    } else {
      router.push(`/onboarding?role=${role}`)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-green-500/30">

      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">MOOOVES</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl font-medium">
            The premium competitive tic-tac-toe arena. Choose your path.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Host Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => handleRoleSelection("host")}
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/5 rounded-3xl blur-xl transition-all duration-500 group-hover:from-amber-500/40 group-hover:to-orange-600/20" />
            <div className="relative h-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-8 md:p-12 rounded-3xl flex flex-col items-center text-center space-y-6 transition-all duration-500 group-hover:border-amber-500/50 shadow-2xl">
              <div className="p-5 bg-amber-500/10 rounded-2xl">
                <Trophy className="w-16 h-16 text-amber-500" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-wide">Host Tournaments</h2>
                <p className="text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Fund the prize pool. Build your community. Earn revenue from your tribe's matches.
                </p>
              </div>
              <div className="mt-auto pt-6">
                <span className="inline-flex items-center text-amber-500 font-semibold group-hover:text-amber-400">
                  Become a Host <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Player Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => handleRoleSelection("player")}
            className="group relative cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/5 rounded-3xl blur-xl transition-all duration-500 group-hover:from-green-500/40 group-hover:to-emerald-600/20" />
            <div className="relative h-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-8 md:p-12 rounded-3xl flex flex-col items-center text-center space-y-6 transition-all duration-500 group-hover:border-green-500/50 shadow-2xl">
              <div className="p-5 bg-green-500/10 rounded-2xl">
                <Gamepad2 className="w-16 h-16 text-green-500" strokeWidth={1.5} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white tracking-wide">Join as Player</h2>
                <p className="text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Enter invite codes, crush opponents in fast-paced grid battles, and win cash prizes.
                </p>
              </div>
              <div className="mt-auto pt-6">
                <span className="inline-flex items-center text-green-500 font-semibold group-hover:text-green-400">
                  Start Playing <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}
