"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { apiClient } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"

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
        const res = await apiClient.getSavedBanks(user.id, user.role)
        if (!res.success) {
          setBanks([])
          setError(res.error || 'Failed to load banks')
          setLoading(false)
          return
        }
        const payload: any = res.data
        const raw = Array.isArray(payload?.data)
          ? payload.data
          : payload?.data
          ? [payload.data]
          : Array.isArray(payload)
          ? payload
          : []
        const normalized: SavedBank[] = raw
          .map((b: any) => ({
            id: b.id || b._id,
            accountNumber: b.accountNumber || b.account_number || "",
            bankCode: b.bankCode || b.bank_code,
            bankName: b.bankName || b.bank_name,
            accountName: b.accountName || b.account_name,
            currency: b.currency,
          }))
          .filter((b: SavedBank) => b.accountNumber)
        setBanks(normalized)
      } catch (e: any) {
        setError(e?.message || "Failed to load banks")
      } finally {
        setLoading(false)
      }
    }
    fetchBanks()
  }, [open, reloadToken, user?.id, user?.role])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,32rem)] max-w-none sm:max-w-[32rem] bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-green-900">Saved bank details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading && <div className="text-green-800 text-sm">Loading...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && banks.length === 0 && (
            <div className="text-green-800 text-sm">No saved banks yet.</div>
          )}
          {!loading && !error && banks.length > 0 && (
            <div className="space-y-2">
              {banks.map((b) => (
                <button
                  key={(b.id || b.accountNumber) as string}
                  onClick={() => onSelect(b)}
                  className="w-full text-left p-3 bg-green-200/60 hover:bg-green-200 rounded-lg border border-green-300"
                >
                  <div className="font-bold text-green-900">
                    {b.bankName || b.bankCode || "Bank"} • {b.accountNumber}
                  </div>
                  {b.accountName && <div className="text-green-700 text-sm">{b.accountName}</div>}
                </button>
              ))}
            </div>
          )}
          <div className="pt-2">
            <button onClick={onAddNew} className="text-green-800 text-sm font-semibold underline">
              Add a new bank
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
