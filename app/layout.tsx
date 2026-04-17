import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
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
  description: "Easy to Learn, Hard to Master",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={armstrong.variable}>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LGJ38MDLKX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-LGJ38MDLKX');
          `}
        </Script>
      </head>
      <body className="font-sans">
        <GameRulesProvider>
          <BackgroundWrapper>{children}</BackgroundWrapper>
        </GameRulesProvider>
      </body>
    </html>
  )
}

