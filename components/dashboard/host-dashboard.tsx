"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTournamentStore } from "@/lib/stores/tournament-store"
import type { Tournament } from '@/lib/types'
import { GameButton } from "@/components/ui/game-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trophy, Users, DollarSign, Calendar, Trash2 } from "lucide-react"
import { CreateTournamentModal } from "@/components/tournament/create-tournament-modal"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import AlertDialogConfirm from "@/components/ui/alert-dialog-confirm"

export function HostDashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)
  const [selectedTournaments, setSelectedTournaments] = useState<Set<string>>(new Set())
  const [showBatchDelete, setShowBatchDelete] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const { user, rehydrated, isAuthenticated } = useAuthStore()
  const { userTournaments = [], loadUserTournaments } = useTournamentStore() as any
  const { toast } = useToast()

  // Helper function to extract tournament ID from different formats
  const getTournamentId = (tournament: any): string => {
    if (!tournament) return ''
    return tournament.id || tournament._id || ''
  }

  const handleBatchDelete = async () => {
    if (!user?.id || selectedTournaments.size === 0) return
    
    const selectedTournamentList = hostedTournaments.filter(t => selectedTournaments.has(getTournamentId(t)))
    const tournamentsWithParticipants = selectedTournamentList.filter(t => (t.currentPlayers || 0) > 0)
    
    if (tournamentsWithParticipants.length > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: `${tournamentsWithParticipants.length} tournament(s) have participants and cannot be deleted.`,
        variant: "destructive" 
      })
      return
    }
    
    setBatchDeleteConfirmOpen(true)
  }

  const handleToggleSelection = (tournamentId: string) => {
    const newSelection = new Set(selectedTournaments)
    if (newSelection.has(tournamentId)) {
      newSelection.delete(tournamentId)
    } else {
      newSelection.add(tournamentId)
    }
    setSelectedTournaments(newSelection)
  }

  const handleDeleteTournament = async (tournament: Tournament) => {
    if (!user?.id) return
    
    const tournamentId = getTournamentId(tournament)
    
    if (!tournamentId) {
      toast({ title: "Error", description: "Invalid tournament ID", variant: "destructive" })
      return
    }
    
    // Check if tournament has participants
    if ((tournament.currentPlayers || 0) > 0) {
      toast({ 
        title: "Cannot Delete", 
        description: "Tournaments with participants cannot be deleted.",
        variant: "destructive" 
      })
      return
    }
    
    setTournamentToDelete(tournament)
    setDeleteConfirmOpen(true)
  }

  const handleActivateTournament = async (tournament: Tournament) => {
    if (!user?.id) return
    
    setLoadingTournamentId(tournament.id)
    try {
      toast({ title: "Initializing Payment", description: "Redirecting to payment gateway..." })
      
      // Store host payment context so the unified payment-return page knows this is a host flow
      localStorage.setItem("pending_host_payment", JSON.stringify({
        tournamentId: tournament.id,
      }))

      const paymentRes = await apiClient.initWalletTransaction({
        amount: 15000,
        method: "flutterwave",
        email: user.email,
        name: user.fullName || "Moooves Host",
        userId: user.id,
        tournamentId: tournament.id,
        redirectUrl: `${window.location.origin}/payment-return`,
      })

      if (paymentRes.success && paymentRes.data?.payment_link) {
        window.location.href = paymentRes.data.payment_link
      } else {
        localStorage.removeItem("pending_host_payment")
        toast({ title: "Payment Failed", description: "Could not initialize payment. Please try again.", variant: "destructive" })
      }
    } catch (error: any) {
      localStorage.removeItem("pending_host_payment")
      toast({ title: "Error", description: error.message || "Failed to initialize payment", variant: "destructive" })
    } finally {
      setLoadingTournamentId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!tournamentToDelete || !user?.id) return
    
    const tournamentId = getTournamentId(tournamentToDelete)
    
    if (!tournamentId) {
      toast({ title: "Error", description: "Invalid tournament ID", variant: "destructive" })
      return
    }
    
    setLoadingTournamentId(tournamentId)
    try {
      const response = await apiClient.deleteTournament(tournamentId)
      
      if (response.success) {
        toast({ title: "Tournament Deleted", description: `"${tournamentToDelete.name}" has been deleted successfully.` })
        // Refresh tournaments list
        if (user?.id && typeof loadUserTournaments === 'function') {
          loadUserTournaments(user.id).catch(() => void 0)
        }
      } else {
        toast({ title: "Delete Failed", description: response.error || "Failed to delete tournament", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete tournament", variant: "destructive" })
    } finally {
      setLoadingTournamentId(null)
      setTournamentToDelete(null)
      setDeleteConfirmOpen(false)
    }
  }

  const handleConfirmBatchDelete = async () => {
    if (!user?.id || selectedTournaments.size === 0) return
    
    setLoadingTournamentId("batch")
    try {
      // Filter tournaments that can be deleted (no participants)
      const deletableTournaments = hostedTournaments.filter(tournament => {
        const tournamentId = getTournamentId(tournament)
        return selectedTournaments.has(tournamentId) && (tournament.currentPlayers || 0) === 0
      })
      
      if (deletableTournaments.length === 0) {
        toast({ title: "No Tournaments to Delete", description: "None of the selected tournaments can be deleted (they all have participants).", variant: "destructive" })
        return
      }
      
      // Delete each tournament
      const deletePromises = deletableTournaments.map(async (tournament) => {
        const tournamentId = getTournamentId(tournament)
        if (tournamentId) {
          return apiClient.deleteTournament(tournamentId)
        }
        return Promise.resolve({ success: false })
      })
      
      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        toast({ title: "Batch Delete Complete", description: `${successCount} tournament(s) deleted successfully.` })
        // Refresh tournaments list
        if (user?.id && typeof loadUserTournaments === 'function') {
          loadUserTournaments(user.id).catch(() => void 0)
        }
        setSelectedTournaments(new Set())
      } else {
        toast({ title: "Delete Failed", description: "Failed to delete any tournaments.", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete tournaments", variant: "destructive" })
    } finally {
      setLoadingTournamentId(null)
      setBatchDeleteConfirmOpen(false)
    }
  }

  const handleExit = () => {
    setExitConfirmOpen(true)
  }

  const handleConfirmExit = () => {
    // Clear localStorage
    localStorage.clear()
    // Redirect to host onboarding
    window.location.href = '/onboarding/host'
  }

  // Load tournaments on mount to ensure the list is up to date
  useEffect(() => {
    if (user?.id && typeof loadUserTournaments === 'function') {
      loadUserTournaments(user.id).catch(() => void 0)
    }
  }, [user?.id, loadUserTournaments])

  if (!rehydrated) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading session...</div>
  }

  if (!user || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <h2 className="text-xl mb-4">Authentication Required</h2>
        <p className="text-gray-300 mb-6">Please log in to access host dashboard</p>
        <GameButton onClick={() => window.location.href = '/onboarding/host'} className="bg-green-600 text-white">
          Go to Host Login
        </GameButton>
      </div>
    </div>
  }

  // Store already filters tournaments for us
  const hostedTournaments: Tournament[] = userTournaments as Tournament[]
  // Calculate total volume (sum of all pools) instead of earnings
  const totalVolume = hostedTournaments.reduce((sum, t) => sum + (t.totalPool || (t.currentPlayers * t.entryFee) || 0), 0)

  const hostName = user?.fullName || user?.email || "Host"

  return (
    <div className="min-h-screen relative pt-24 sm:pt-28">
      {/* Use the global background (app/layout.tsx) so non-onboarding routes use dashboard-background.png */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-1 truncate max-w-[200px] sm:max-w-md md:max-w-xl">
              Welcome, {hostName}
            </h1>
            <p className="text-sm md:text-base text-green-100">
              Manage your tournaments, view stats, and take quick actions
            </p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto flex gap-2">
            <GameButton onClick={handleExit} className="w-full sm:w-auto bg-gray-200 text-gray-800">
              Exit
            </GameButton>
          </div>
        </div>

        {/* Host Stats - Compact Design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Hosted</p>
                <p className="text-lg font-bold text-green-900">{hostedTournaments.length}</p>
              </div>
              <Calendar className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Players</p>
                <p className="text-lg font-bold text-green-900">
                  {hostedTournaments.reduce((sum: number, t: Tournament) => sum + (t.currentPlayers || 0), 0)}
                </p>
              </div>
              <Users className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Pool</p>
                <p className="text-lg font-bold text-green-900">
                  ₦{totalVolume.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>

          <Card className="bg-green-100/95 border border-green-600 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Active</p>
                <p className="text-lg font-bold text-green-900">
                  {hostedTournaments.filter((t: Tournament) => t.status === "active").length}
                </p>
              </div>
              <Trophy className="w-5 h-5 text-green-600 opacity-70" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main list */}
          <div className="lg:col-span-2">
            <Card className="bg-green-100/95 border-2 border-green-600">
              <CardHeader>
                <CardTitle className="text-green-900">Your Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                {hostedTournaments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-green-800 font-semibold">No tournaments created yet</p>
                    <p className="text-sm text-green-700 mb-4">Create your first tournament to start earning!</p>
                    <GameButton onClick={() => setShowCreateModal(true)} className="mx-auto max-w-xs">
                      Create Tournament
                    </GameButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostedTournaments.map((tournament: Tournament) => {
                      const tournamentId = getTournamentId(tournament)
                      return (
                      <Card key={tournamentId} className="hover:shadow-md transition-shadow bg-white border-green-300">
                        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                          <div className="flex-1 w-full sm:w-auto">
                            <h3 className="text-base sm:text-lg font-semibold text-green-900">{tournament.name}</h3>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-green-700 mt-1">
                              <span><span className="font-semibold text-green-800">{tournament.currentPlayers || 0}</span> / {tournament.maxPlayers || 0} players</span>
                              <span>•</span>
                              <span>Entry: <span className="font-semibold text-green-800">₦{(tournament.entryFee || 0).toLocaleString()}</span></span>
                              <span>•</span>
                              <span>Pool: <span className="font-semibold text-green-800">₦{(tournament.totalPool || 0).toLocaleString()}</span></span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">Invite Code: {tournament.inviteCode}</p>
                          </div>

                          <div className="flex-shrink-0 text-right flex flex-col items-end gap-2 w-full sm:w-auto">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                tournament.status === "active"
                                  ? "bg-green-200 text-green-900"
                                  : tournament.status === "waiting"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : tournament.status === "pending"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {tournament.status === "pending" ? "Pending Payment" : tournament.status}
                            </span>
                            
                            {tournament.status === "pending" ? (
                              <div className="flex gap-2 w-full sm:w-auto">
                                <GameButton 
                                  onClick={() => handleActivateTournament(tournament)}
                                  disabled={loadingTournamentId === tournamentId}
                                  className="w-full sm:w-auto text-sm py-2 bg-orange-600 hover:bg-orange-700"
                                >
                                  {loadingTournamentId === tournamentId ? "Processing..." : "Activate (NGN 15,000)"}
                                </GameButton>
                                <Link href={`/tournaments/${tournamentId}`} className="w-full sm:w-auto">
                                  <GameButton className="w-full sm:w-auto text-sm py-2 bg-gray-200 text-gray-800 hover:bg-gray-300">
                                    View
                                  </GameButton>
                                </Link>
                              </div>
                            ) : (
                              <div className="flex gap-2 w-full sm:w-auto">
                                {(tournament.currentPlayers || 0) === 0 && (
                                  <GameButton 
                                    onClick={() => handleDeleteTournament(tournament)}
                                    disabled={loadingTournamentId === tournamentId}
                                    className="w-full sm:w-auto text-sm py-2 bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {loadingTournamentId === tournamentId ? "Deleting..." : "Delete"}
                                  </GameButton>
                                )}
                                <Link href={`/tournaments/${tournamentId}`} className="w-full sm:w-auto">
                                  <GameButton className="w-full sm:w-auto text-sm py-2">
                                    View
                                  </GameButton>
                                </Link>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions / summary */}
          <div>
            <Card className="bg-green-100/95 border-2 border-green-600">
              <CardHeader>
                <CardTitle className="text-green-900">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <GameButton onClick={() => setShowCreateModal(true)} className="justify-start text-sm py-3">
                    <Plus className="w-4 h-4" /> Create tournament
                  </GameButton>
                  <GameButton onClick={() => { }} className="justify-start text-sm py-3">
                    <Users className="w-4 h-4" /> View players
                  </GameButton>
                  <GameButton onClick={() => { }} className="justify-start text-sm py-3">
                    <Trophy className="w-4 h-4" /> Manage active
                  </GameButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CreateTournamentModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      
      {/* Single Tournament Delete Confirmation */}
      <AlertDialogConfirm
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Tournament"
        description={`Are you sure you want to delete "${tournamentToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
      />
      
      {/* Batch Delete Confirmation */}
      <AlertDialogConfirm
        open={batchDeleteConfirmOpen}
        onOpenChange={setBatchDeleteConfirmOpen}
        title="Delete Multiple Tournaments"
        description={`Are you sure you want to delete ${selectedTournaments.size} tournament(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={handleConfirmBatchDelete}
      />
      
      {/* Exit Confirmation */}
      <AlertDialogConfirm
        open={exitConfirmOpen}
        onOpenChange={setExitConfirmOpen}
        title="Exit Host Dashboard"
        description="Are you sure you want to exit? This will clear your session and take you back to the host login page."
        confirmLabel="Exit"
        cancelLabel="Cancel"
        onConfirm={handleConfirmExit}
      />
    </div>
  )
}
