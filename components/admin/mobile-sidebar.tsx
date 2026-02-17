"use client"

import { Menu, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarSections } from "@/components/admin/admin-sidebar"

export function MobileSidebar() {
    const pathname = usePathname()
    const logout = useAuthStore((state) => state.logout)

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-black border-gray-900 w-72 text-white">
                <div className="flex flex-col h-full">
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

                    <div className="p-4 border-t border-gray-900 space-y-2">
                        <Link href="/admin/faq" className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all group", pathname.startsWith("/admin/faq") ? "bg-[#B8E6B9] text-[#1a381b] font-bold shadow-sm" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200")}>
                            <HelpCircle className={cn("w-5 h-5", pathname.startsWith("/admin/faq") ? "text-[#1a381b]" : "text-white")} />
                            <span className="font-medium">FAQ/Support</span>
                        </Link>

                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-500/10 hover:text-red-500 transition-all font-bold"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
