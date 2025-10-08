import React, { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { GameButton } from "@/components/ui/game-button";

export function BankLinkForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  // Step 1: Verify account number and bank code
  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setAccountName(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/bank/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server. Please check your details and try again.");
        return;
      }
      if (!res.ok || !data.account_name) {
        setError(data.message || "Verification failed");
        return;
      }
      setAccountName(data.account_name);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/bank/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          accountNumber,
          bankCode,
          role,
          userId: user?.id,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server. Please check your details and try again.");
        return;
      }
      if (!res.ok || !data.accountName) {
        setError(data.message || "Failed to save bank details");
        return;
      }
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
          type="text"
          placeholder="Bank Code (e.g. 044)"
          value={bankCode}
          onChange={e => setBankCode(e.target.value)}
          className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="user">User</option>
          <option value="host">Host</option>
        </select>
        <GameButton disabled={loading || !accountNumber || !bankCode} onClick={handleVerify} className="w-full">
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
