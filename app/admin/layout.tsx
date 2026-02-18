"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, rehydrated } = useAuthStore()
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)

    // Auth bypass for development/demo
    // useEffect(() => {
    //     if (!rehydrated) return
    //     if (!isAuthenticated || !user) {
    //          // router.replace("/onboarding")
    //          // return
    //     }
    //     setIsAuthorized(true)
    // }, [isAuthenticated, user, rehydrated, router])

    // Always render content
    // if (!rehydrated || !isAuthorized) return <Loader... />

    return (
        <div className="flex min-h-screen bg-black font-sans text-white">
            {/* Sidebar */}
            <div className="hidden md:block h-screen sticky top-0">
                <AdminSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <AdminHeader />
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
