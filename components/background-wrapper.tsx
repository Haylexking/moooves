"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuth = pathname?.startsWith("/onboarding") || pathname?.startsWith("/auth") || pathname === "/"

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
