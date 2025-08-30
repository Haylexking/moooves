import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const armstrong = Inter({
  subsets: ["latin"],
  variable: "--font-armstrong",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MOOOVES Game",
  description: "Strategic tile placement game",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={armstrong.variable}>
      <head>
        <style>{`
html {
  font-family: var(--font-armstrong), 'Armstrong', system-ui, sans-serif;
  --font-sans: var(--font-armstrong);
  --font-mono: 'Courier New', monospace;
}
        `}</style>
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
