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

    useEffect(() => {
        // Wait for store rehydration
        if (!rehydrated) return

        // 1. Not logged in -> Redirect to login
        if (!isAuthenticated || !user) {
            router.replace("/login")
            return
        }

        // 2. Logged in but not admin -> Redirect to dashboard
        if (user.role !== "admin") {
            router.replace("/dashboard")
            return
        }

        // 3. Authorized
        setIsAuthorized(true)
    }, [isAuthenticated, user, rehydrated, router])

    // Show loading state while checking auth
    if (!rehydrated || !isAuthorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        )
    }

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
