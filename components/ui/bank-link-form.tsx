import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { GameButton } from "@/components/ui/game-button";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export function BankLinkForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [role, setRole] = useState("user");
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);

  // Load bank list from Swagger endpoint to allow name selection
  useEffect(() => {
    let mounted = true
    const loadBanks = async () => {
      try {
        const res = await apiClient.listBanks()
        if (!mounted) return
        const data: any = res.data || {}
        const list = (data?.banks || data) as Array<{ name: string; code: string }>
        if (Array.isArray(list)) setBanks(list)
      } catch { }
    }
    loadBanks()
    return () => { mounted = false }
  }, [])

  const resolveBankCode = async () => {
    if (bankCode) return bankCode
    if (!bankName) return ""
    try {
      const r = await apiClient.findBankByName(bankName)
      const data: any = r.data || {}
      const found = Array.isArray(data?.banks) ? data.banks[0] : null
      return found?.code ? String(found.code) : ""
    } catch {
      return ""
    }
  }

  const handleVerify = async () => {
    if (!accountNumber) {
      setError("Enter your account number to verify.")
      return
    }
    setVerifying(true);
    setError(null);
    setAccountName(null);
    setSuccessMessage(null);
    try {
      let code = bankCode
      if (!code) {
        code = await resolveBankCode()
        if (!code) {
          setError("Select a bank to verify.")
          return
        }
        setBankCode(code)
      }
      const res = await apiClient.verifyBankAccount({ accountNumber, bankCode: code })
      if (!res.success) {
        const data: any = res.data || {}
        const msg = res.error || data?.message || "Verification failed. Please check your details."
        setError(msg)
        toast.error(msg)
        return
      }
      const payload: any = res.data || {}
      const name = payload.account_name || payload.accountName || null
      if (name) {
        setAccountName(name)
        setSuccessMessage("Account verified successfully.")
        toast.success("Account verified successfully.")
      } else {
        setError("Bank verified but account name was not returned.")
        toast.warning("Bank verified but account name was not returned.")
      }
    } catch (err: any) {
      const msg = err.message || "Verification error"
      setError(msg);
      toast.error(msg)
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Save verified bank details
  const handleSave = async () => {
    if (!accountName) {
      setError("Verify your account before saving.")
      return
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const code = bankCode || (await resolveBankCode())
      if (!code) {
        setError("Select a bank to save.")
        return
      }
      const payload = {
        accountNumber,
        bankCode: code,
        role,
        userId: user?.id,
      }
      const ar = await apiClient.addBank(payload)
      const data: any = ar.data || {}
      if (!ar.success) {
        const msg = (ar.error || data?.message) || "Failed to save bank details"
        setError(msg)
        toast.error(msg)
        return
      }
      if (data.accountName) setAccountName(data.accountName)
      setSuccessMessage("Bank details saved successfully.")
      toast.success("Bank details saved successfully.")
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || "Save error"
      setError(msg);
      toast.error(msg)
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border-2 border-green-600 rounded-2xl bg-green-50 shadow-xl">
      <h2 className="font-bold text-xl text-green-800 mb-2">Link Bank Account</h2>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Account Number"
          value={accountNumber}
          onChange={e => setAccountNumber(e.target.value)}
          className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          list="bank-list"
          type="text"
          placeholder="Search and select your bank"
          value={bankName}
          onChange={e => {
            const name = e.target.value
            setBankName(name)
            const matched = banks.find(b => b.name.toLowerCase() === name.toLowerCase())
            setBankCode(matched?.code || "")
          }}
          className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <datalist id="bank-list">
          {banks.map((b) => (
            <option key={b.code} value={b.name} />
          ))}
        </datalist>
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="user">User</option>
          <option value="host">Host</option>
        </select>
        <GameButton disabled={verifying || !accountNumber || !(bankCode || bankName)} onClick={handleVerify} className="w-full">
          {verifying ? "Verifying..." : "Verify Account"}
        </GameButton>
        {accountName && (
          <div className="text-green-700 font-semibold">Account Name: {accountName}</div>
        )}
        {successMessage && <div className="text-green-700 text-sm">{successMessage}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <GameButton disabled={saving || !accountName} onClick={handleSave} className="w-full">
          {saving ? "Saving..." : "Save Bank Details"}
        </GameButton>
      </div>
    </div>
  );
}
