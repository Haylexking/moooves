"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Wallet,
    MessageSquare,
    Trophy,
    Users,
    ClipboardList,
    HelpCircle,
    Settings,
    LogOut,
    Gamepad2,
    FileText
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"

export const sidebarSections = [
    {
        category: "",
        items: [
            { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { title: "Finance", href: "/admin/finances", icon: Wallet },
            { title: "Messages", href: "/admin/messages", icon: MessageSquare },
        ]
    },
    {
        category: "Game",
        items: [
            { title: "Tournaments", href: "/admin/tournaments", icon: Trophy },
            { title: "Players", href: "/admin/users", icon: Gamepad2 },
            { title: "Rules", href: "/admin/rules", icon: ClipboardList },
        ]
    },
    {
        category: "Settings",
        items: [
            { title: "FAQ/Support", href: "/admin/faq", icon: HelpCircle },
            { title: "Settings", href: "/admin/settings", icon: Settings },
        ]
    }
]

export function AdminSidebar() {
    const pathname = usePathname()
    const logout = useAuthStore((state) => state.logout)

    return (
        <div className="flex flex-col h-full bg-black border-r border-gray-900 text-white w-64 min-h-screen sticky top-0">
            <div className="p-8">
                <h1 className="text-2xl font-black italic tracking-tighter text-green-500">
                    MOOOVES
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
                {sidebarSections.map((section, idx) => (
                    <div key={idx}>
                        {section.category && (
                            <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                                {section.category}
                            </h3>
                        )}
                        <div className="space-y-2">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium",
                                            isActive
                                                ? "bg-[#C4F5C8] text-[#002B03]"
                                                : "text-gray-400 hover:bg-gray-900 hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5", isActive ? "text-[#002B03]" : "text-gray-400 group-hover:text-white")} />
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-900">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-500/10 hover:text-red-500 transition-all font-bold"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </div>
    )
}
