"use client"

import { useState } from "react"
import type { User } from "@/lib/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface UsersTableProps {
    users: User[]
    onUpdate: () => void
}

export function UsersTable({ users, onUpdate }: UsersTableProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState<string | null>(null)

    const handleBan = async (userId: string) => {
        setLoading(userId)
        try {
            const res = await apiClient.bansUser(userId, "Admin action")
            if (res.success) {
                toast({ title: "User banned", variant: "default" })
                onUpdate()
            } else {
                toast({ title: "Failed to ban user", description: res.error, variant: "destructive" })
            }
        } finally {
            setLoading(null)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        setLoading(userId)
        try {
            const res = await apiClient.deleteUser(userId)
            if (res.success) {
                toast({ title: "User deleted", variant: "default" })
                onUpdate()
            } else {
                toast({ title: "Failed to delete user", description: res.error, variant: "destructive" })
            }
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="rounded-md border border-gray-800 bg-gray-900/50">
            <Table>
                <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="w-[200px]">User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800/50">
                            <TableCell className="font-medium text-white flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                                    {user.fullName?.[0] || "?"}
                                </div>
                                {user.fullName}
                            </TableCell>
                            <TableCell className="text-gray-400">{user.email}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {user.role === "admin" && <ShieldAlert className="w-4 h-4 text-red-500" />}
                                    {user.role === "host" && <ShieldCheck className="w-4 h-4 text-green-500" />}
                                    {user.role === "player" && <Shield className="w-4 h-4 text-gray-500" />}
                                    <span className="capitalize text-sm">{user.role || "player"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.emailVerified ? "outline" : "secondary"} className="text-xs">
                                    {user.emailVerified ? "Verified" : "Unverified"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem
                                            className="cursor-pointer"
                                            onClick={() => navigator.clipboard.writeText(user.id)}
                                        >
                                            Copy ID
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-800" />
                                        <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={() => handleBan(user.id)}>
                                            Ban User
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={() => handleDelete(user.id)}>
                                            Delete User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
