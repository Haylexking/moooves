import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// Import global styles for Next.js (side-effect import)
import "./globals.css"
import Image from "next/image"
import GameRulesProvider from "@/components/game/GameRulesProvider"

const armstrong = Inter({
  subsets: ["latin"],
  variable: "--font-armstrong",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOOOVES Game",
  description: "Strategic tile placement game",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={armstrong.variable}>
      <body className="font-sans">
        <GameRulesProvider>
          <BackgroundWrapper>{children}</BackgroundWrapper>
        </GameRulesProvider>
      </body>
    </html>
  )
}

// Client component to handle background switching
function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  // This must be a client component
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const isAuth = pathname.startsWith("/onboarding") || pathname.startsWith("/auth")
  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw", overflow: "hidden" }}>
      <Image
        src={isAuth ? "/images/background.png" : "/images/dashboard-background.png"}
        alt="Background"
        fill
        className="object-cover object-center z-0 opacity-90"
        priority
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  )
}
