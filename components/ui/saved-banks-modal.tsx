"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "sonner"

export interface SavedBank {
  id?: string
  accountNumber: string
  bankCode?: string
  bankName?: string
  accountName?: string
  currency?: string
}

export function SavedBanksModal({
  open,
  onOpenChange,
  onSelect,
  onAddNew,
  reloadToken,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelect: (bank: SavedBank) => void
  onAddNew: () => void
  reloadToken?: number | string
}) {
  const [banks, setBanks] = useState<SavedBank[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!open) return
    const fetchBanks = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user?.id || !user?.role) {
          setBanks([])
          setLoading(false)
          return
        }

        // Fetch bank list for name resolution
        let bankMap: Record<string, string> = {}
        try {
          const bankRes = await apiClient.listBanks()
          const bankData: any = bankRes.data || {}
          const bankList = (bankData?.banks || bankData) as Array<{ name: string; code: string }>
          if (Array.isArray(bankList)) {
            bankList.forEach(b => {
              bankMap[b.code] = b.name
            })
          }
        } catch { }

        // Start with user's embedded bank account if available
        const localBanks: SavedBank[] = []
        if (user.bankAccount) {
          localBanks.push({
            id: "primary",
            accountNumber: user.bankAccount.accountNumber,
            bankCode: user.bankAccount.bankCode,
            accountName: user.bankAccount.accountName,
            bankName: bankMap[user.bankAccount.bankCode] || "Primary Account"
          })
        }

        const res = await apiClient.getSavedBanks(user.id, user.role)
        let fetchedBanks: SavedBank[] = []

        if (res.success) {
          const payload: any = res.data
          const raw = Array.isArray(payload?.data)
            ? payload.data
            : payload?.data
              ? [payload.data]
              : Array.isArray(payload)
                ? payload
                : []

          fetchedBanks = raw
            .filter((b: any) => {
              const bUserId = b._id || b.id || b.userId || b.user_id
              return String(bUserId) === String(user.id)
            })
            .map((u: any) => {
              const bank = u.bankAccount || {}
              return {
                id: u._id,
                accountNumber: bank.accountNumber,
                bankCode: bank.bankCode,
                accountName: bank.accountName,
                bankName: bankMap[bank.bankCode] || bank.bankName,
                userId: u._id,
                role: u.role
              }
            })
            .filter((b: SavedBank) => b.accountNumber)
        }

        // Merge and deduplicate by account number
        const allBanks = [...localBanks, ...fetchedBanks]
        const uniqueBanks = Array.from(new Map(allBanks.map(item => [item.accountNumber, item])).values())

        setBanks(uniqueBanks)
        setStatus(null)
      } catch (e: any) {
        // Even if fetch fails, show local bank if available
        if (user?.bankAccount) {
          // Try to resolve name again if possible, though map might be empty if fetch failed
          let bankName = "Primary Account"
          try {
            const bankRes = await apiClient.listBanks()
            const bankData: any = bankRes.data || {}
            const bankList = (bankData?.banks || bankData) as Array<{ name: string; code: string }>
            const found = bankList?.find(b => b.code === user.bankAccount?.bankCode)
            if (found) bankName = found.name
          } catch { }

          setBanks([{
            id: "primary",
            accountNumber: user.bankAccount.accountNumber,
            bankCode: user.bankAccount.bankCode,
            accountName: user.bankAccount.accountName,
            bankName
          }])
        } else {
          setError(e?.message || "Failed to load banks")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchBanks()
  }, [open, reloadToken, user?.id, user?.role, user?.bankAccount])

  const handleRemoveBanks = async () => {
    if (!user?.id || !user?.role) {
      setError("You must be signed in to remove bank details.")
      return
    }
    const role = user.role === "host" ? "host" : "user"
    try {
      setRemoving(true)
      setError(null)
      setStatus(null)
      const res = await apiClient.removeBank({ userId: user.id, role })
      if (!res.success) {
        const data: any = res.data || {}
        throw new Error(res.error || data?.message || "Failed to remove bank details")
      }
      setBanks([])
      setStatus("Bank details removed successfully.")
      toast.success("Bank details removed successfully.")
    } catch (err: any) {
      const msg = err?.message || "Failed to remove bank details"
      setError(msg)
      toast.error(msg)
    } finally {
      setRemoving(false)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,32rem)] max-w-none sm:max-w-[32rem] bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-green-900">Saved bank details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading && <div className="text-green-800 text-sm">Loading...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {status && <div className="text-green-700 text-sm">{status}</div>}
          {!loading && !error && banks.length === 0 && (
            <div className="text-green-800 text-sm">No saved banks yet.</div>
          )}
          {!loading && !error && banks.length > 0 && (
            <div className="space-y-2">
              {banks.map((b) => (
                <div
                  key={(b.id || b.accountNumber) as string}
                  className="w-full p-3 bg-green-200/60 rounded-lg border border-green-300"
                >
                  <button
                    onClick={() => onSelect(b)}
                    className="w-full text-left focus:outline-none"
                  >
                    <div className="font-bold text-green-900">
                      {b.bankName || b.bankCode || "Bank"} • {b.accountNumber}
                    </div>
                    {b.accountName && <div className="text-green-700 text-sm">{b.accountName}</div>}
                  </button>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveBanks()
                      }}
                      disabled={removing}
                    >
                      {removing ? "Removing..." : "Remove bank"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2">
            <button onClick={onAddNew} className="text-green-800 text-sm font-semibold underline">
              Add a new bank
            </button>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  )
}
