import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// Import global styles for Next.js (side-effect import)
import "./globals.css"
import GameRulesProvider from "@/components/game/GameRulesProvider"
import { BackgroundWrapper } from "@/components/background-wrapper"

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

