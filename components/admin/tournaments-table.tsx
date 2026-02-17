"use client"

import { useState } from "react"
import type { Tournament } from "@/lib/types"
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
import { MoreHorizontal, Users, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface TournamentsTableProps {
    tournaments: Tournament[]
    onUpdate: () => void
}

export function TournamentsTable({ tournaments, onUpdate }: TournamentsTableProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) return
        setLoading(id)
        try {
            const res = await apiClient.deleteTournament(id)
            if (res.success) {
                toast({ title: "Tournament deleted", variant: "default" })
                onUpdate()
            } else {
                toast({ title: "Failed to delete", description: res.error, variant: "destructive" })
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
                        <TableHead className="w-[300px]">Tournament Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Prize Pool</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tournaments.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                No tournaments found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tournaments.map((tournament) => (
                            <TableRow key={tournament.id} className="border-gray-800 hover:bg-gray-800/50">
                                <TableCell className="font-medium text-white">
                                    <div>
                                        {tournament.name}
                                        <div className="text-xs text-gray-500 font-mono mt-1">{tournament.id}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            tournament.status === "active" ? "border-green-500 text-green-500" :
                                                tournament.status === "completed" ? "border-gray-500 text-gray-500" :
                                                    "border-yellow-500 text-yellow-500"
                                        }
                                    >
                                        {tournament.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Users className="w-4 h-4" />
                                        <span>{tournament.currentPlayers} / {tournament.maxPlayers}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-green-400 font-mono">
                                    ₦{tournament.totalPool?.toLocaleString() || 0}
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {tournament.createdAt ? format(new Date(tournament.createdAt), "MMM d, yyyy") : "-"}
                                    </div>
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
                                                onClick={() => navigator.clipboard.writeText(tournament.inviteCode)}
                                            >
                                                Copy Invite Code
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-800" />
                                            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={() => handleDelete(tournament.id)}>
                                                Force Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
