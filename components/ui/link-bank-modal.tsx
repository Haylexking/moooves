"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BankLinkForm } from "@/components/ui/bank-link-form"

export function LinkBankModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; onSuccess?: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,32rem)] max-w-none sm:max-w-[32rem] bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-600">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-green-900">Link Bank Account</DialogTitle>
        </DialogHeader>
        <BankLinkForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
