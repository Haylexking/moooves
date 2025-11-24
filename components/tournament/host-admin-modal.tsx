"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"
import { toast } from "@/hooks/use-toast"
import { TournamentBracket } from "@/lib/types"

interface HostAdminModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tournamentId: string
    bracket?: TournamentBracket
    onUpdate: () => void
}

export function HostAdminModal({ open, onOpenChange, tournamentId, bracket, onUpdate }: HostAdminModalProps) {
    const [selectedMatchId, setSelectedMatchId] = useState<string>("")
    const [winnerId, setWinnerId] = useState<string>("")
    const [loading, setLoading] = useState(false)

    // Flatten matches for selection
    const activeMatches = bracket?.rounds.flatMap(r => r.matches).filter(m => m.status !== "completed") || []

    const handleSubmitResult = async () => {
        if (!selectedMatchId || !winnerId) return

        setLoading(true)
        try {
            // Note: This assumes the API supports manual submission by host
            // We might need to use a specific admin endpoint or just the regular submitMatchResult if the backend allows hosts to do it
            const res = await apiClient.submitMatchResult(selectedMatchId, winnerId)

            if (res.success) {
                toast({ title: "Result Submitted", description: "Match updated successfully." })
                onUpdate()
                onOpenChange(false)
            } else {
                toast({ title: "Failed", description: res.error || "Could not submit result", variant: "destructive" })
            }
        } catch (err) {
            toast({ title: "Error", description: "An error occurred", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 border border-yellow-600 text-white">
                <DialogHeader>
                    <DialogTitle className="text-yellow-500">Host Admin Tools</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Manually submit results for stuck matches or disputes.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Match</Label>
                        <Select onValueChange={setSelectedMatchId} value={selectedMatchId}>
                            <SelectTrigger className="bg-black/50 border-gray-700">
                                <SelectValue placeholder="Select an active match" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                {activeMatches.length === 0 ? (
                                    <SelectItem value="none" disabled>No active matches</SelectItem>
                                ) : (
                                    activeMatches.map(match => (
                                        <SelectItem key={match.id} value={match.id}>
                                            R{match.roundNumber}: {match.player1Id.slice(0, 4)} vs {match.player2Id.slice(0, 4)}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMatchId && (
                        <div className="space-y-2">
                            <Label>Select Winner</Label>
                            <Select onValueChange={setWinnerId} value={winnerId}>
                                <SelectTrigger className="bg-black/50 border-gray-700">
                                    <SelectValue placeholder="Who won?" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                    {(() => {
                                        const match = activeMatches.find(m => m.id === selectedMatchId)
                                        if (!match) return null
                                        return (
                                            <>
                                                <SelectItem value={match.player1Id}>Player 1 ({match.player1Id.slice(0, 6)})</SelectItem>
                                                <SelectItem value={match.player2Id}>Player 2 ({match.player2Id.slice(0, 6)})</SelectItem>
                                            </>
                                        )
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmitResult}
                        disabled={loading || !selectedMatchId || !winnerId}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                        {loading ? "Submitting..." : "Submit Result"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
