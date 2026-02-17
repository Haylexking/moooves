"use client"

import { Input } from "@/components/ui/input"
import { Search, Bell, Briefcase } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { NotificationPanel } from "@/components/admin/notification-panel"
import { MobileSidebar } from "@/components/admin/mobile-sidebar"

export function AdminHeader() {
    const user = useAuthStore((state) => state.user)

    return (
        <header className="h-20 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black px-6 flex items-center justify-between sticky top-0 z-40 w-full">
            <div className="flex items-center gap-4 w-1/3 min-w-[300px]">
                <MobileSidebar />
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search tournaments, players..."
                        className="pl-10 bg-gray-50 dark:bg-gray-900 border-none rounded-full h-11 text-sm w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                    <Briefcase className="w-5 h-5" />
                </button>

                <Popover>
                    <PopoverTrigger asChild>
                        <button className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-none mr-6 mt-2" align="end" sideOffset={5}>
                        <NotificationPanel onClose={() => { }} />
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-3 ml-2">
                    <Avatar className="h-10 w-10 border-2 border-green-500">
                        <AvatarImage src="/admin-avatar.png" alt="Admin" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.fullName || "John Doe"}</p>
                        <p className="text-xs text-gray-500 mt-1">Admin</p>
                    </div>
                </div>
            </div>
        </header>
    )
}
