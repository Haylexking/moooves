"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import Link from "next/link"

interface PlayerCardProps {
    user: {
        id: string
        name: string
        email?: string // Optional
        joinedDate: string
        isDeleted?: boolean
    }
}

export function PlayerCard({ user }: PlayerCardProps) {
    return (
        <Card className="border-none bg-[#FFF5F5] dark:bg-gray-800/10 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#FFE4E4] dark:bg-red-900/10 flex items-center justify-center mb-4 text-[#EA7E7E]">
                    <User className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{user.name}</h3>

                <p className="text-xs text-gray-500 mt-1 mb-4">
                    {user.isDeleted ? `Deleted: ${user.joinedDate}` : `Joined: ${user.joinedDate}`}
                </p>

                <Link href={`/admin/users/${user.id}`} className="w-full">
                    <Button variant="outline" className="w-full bg-transparent border-gray-200 hover:bg-white text-gray-600 text-xs h-9 rounded-lg">
                        {user.isDeleted ? "View profile" : "View profile"}
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
