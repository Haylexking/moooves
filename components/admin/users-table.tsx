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
import AlertDialogConfirm from "@/components/ui/alert-dialog-confirm"

interface UsersTableProps {
    users: User[]
    onUpdate: () => void
}

export function UsersTable({ users, onUpdate }: UsersTableProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState<string | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)

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
        setUserToDelete(userId)
        setDeleteConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!userToDelete) return
        setLoading(userToDelete)
        try {
            const res = await apiClient.deleteUser(userToDelete)
            if (res.success) {
                toast({ title: "User deleted", variant: "default" })
                onUpdate()
            } else {
                toast({ title: "Failed to delete user", description: res.error, variant: "destructive" })
            }
        } finally {
            setLoading(null)
            setUserToDelete(null)
            setDeleteConfirmOpen(false)
        }
    }

    return (
        <>
            <div className="rounded-md border border-gray-800 bg-gray-900/50">
                <Table>
                    <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-transparent">
                            <TableHead className="w-[200px]">User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="border-gray-800">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                                            {user.fullName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{user.fullName || "Unknown"}</div>
                                            <div className="text-gray-400 text-sm">ID: {user.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-300">{user.email}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            user.role === "admin" ? "border-purple-500 text-purple-500" :
                                                user.role === "host" ? "border-blue-500 text-blue-500" :
                                                    "border-gray-500 text-gray-500"
                                        }
                                    >
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            user.status === "active" ? "border-green-500 text-green-500" :
                                                "border-red-500 text-red-500"
                                        }
                                    >
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
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
            <AlertDialogConfirm
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete User"
                description="Are you sure you want to delete this user?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
            />
        </>
    )
}
