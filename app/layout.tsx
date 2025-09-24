
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Image from "next/image"
import { usePathname } from "next/navigation"

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
  // Use a client component to access the path
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
      <body className="font-sans">
        <BackgroundWrapper>{children}</BackgroundWrapper>
      </body>
    </html>
  )
}

// Client component to handle background switching
function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  // This must be a client component
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAuth = pathname.startsWith('/onboarding') || pathname.startsWith('/auth');
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Image
        src={isAuth ? "/images/background.png" : "/images/dashboard-background.png"}
        alt="Background"
        fill
        className="object-cover object-center z-0 opacity-90"
        priority
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
