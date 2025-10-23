import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { GameButton } from "@/components/ui/game-button";
import { apiClient } from "@/lib/api/client";

export function BankLinkForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
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
      } catch {}
    }
    loadBanks()
    return () => { mounted = false }
  }, [])

  // Step 1: Verify account number and bank code
  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setAccountName(null);
    try {
      // If bankCode is not known, try to find by name via Swagger endpoint
      let resolvedBankCode = bankCode
      if (!resolvedBankCode && bankName) {
        try {
          const r = await apiClient.findBankByName(bankName)
          const j: any = r.data || {}
          const found = Array.isArray(j?.banks) ? j.banks[0] : null
          if (found?.code) resolvedBankCode = String(found.code)
        } catch {}
      }
      // No dedicated verify endpoint in Swagger. We'll confirm on save (add), which returns accountName.
      setBankCode(resolvedBankCode || bankCode)
    } catch (err: any) {
      setError(err.message || "Verification error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Save verified bank details
  const handleSave = async () => {
    if (!accountName) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        accountNumber,
        bankCode: bankCode || (banks.find(b => b.name === bankName)?.code ?? ""),
        role,
        userId: user?.id,
      }
      const ar = await apiClient.addBank(payload)
      const data: any = ar.data || {}
      if (!ar.success) {
        setError((ar.error || data?.message) || "Failed to save bank details")
        return
      }
      // If backend returns accountName (per Swagger), reflect it
      if (data.accountName) setAccountName(data.accountName)
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Save error");
    } finally {
      setLoading(false);
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
        <GameButton disabled={loading || !accountNumber || !(bankCode || bankName)} onClick={handleVerify} className="w-full">
          {loading ? "Verifying..." : "Verify Account"}
        </GameButton>
        {accountName && (
          <div className="text-green-700 font-semibold">Account Name: {accountName}</div>
        )}
        {error && <div className="text-red-600">{error}</div>}
        <GameButton disabled={loading || !accountName} onClick={handleSave} className="w-full">
          {loading ? "Saving..." : "Save Bank Details"}
        </GameButton>
      </div>
    </div>
  );
}
