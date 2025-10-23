"use client"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { LinkBankModal } from "@/components/ui/link-bank-modal"
import { SavedBanksModal } from "@/components/ui/saved-banks-modal"
import type { SavedBank } from "@/components/ui/saved-banks-modal"
import { GameButton } from "@/components/ui/game-button"
import { useState, useEffect } from "react"
import Image from "next/image"
import { apiClient } from "@/lib/api/client"

interface Transaction {
  id: string
  type: "credit" | "debit"
  description: string
  amount: number
  date: string
}

type ActiveTab = "fund" | "request"
type ModalType = "success" | "failed" | "requestSuccess" | null

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("fund")
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("Play game")
  const [accountNumber, setAccountNumber] = useState("XXXX-XXXX-XXXX")
  const [bankName, setBankName] = useState("Access bank")
  const [accountName, setAccountName] = useState("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showSavedBanks, setShowSavedBanks] = useState(false)
  const [banksReloadToken, setBanksReloadToken] = useState(0)
  const [selectedBank, setSelectedBank] = useState<SavedBank | null>(null)

  useEffect(() => {
    // Fetch wallet data from backend
    const fetchWalletData = async () => {
      try {
        const res = await apiClient.getWalletSummary()
        if (res.success) {
          const d: any = res.data || {}
          const bal = d.balance ?? d.data?.balance ?? 0
          const tx = Array.isArray(d.transactions) ? d.transactions : (Array.isArray(d.data?.transactions) ? d.data.transactions : [])
          setBalance(Number(bal) || 0)
          setTransactions(tx as any)
        } else {
          console.debug("Wallet", { method: "GET", error: res.error })
        }
      } catch (error) {
        console.debug("Wallet", { method: "GET", error: String(error) })
      }
    }
    fetchWalletData()
  }, [])

  // When switching to request tab, ensure a bank is selected via modal first
  useEffect(() => {
    if (activeTab === "request" && !selectedBank) {
      setShowSavedBanks(true)
    }
  }, [activeTab, selectedBank])

  const handleFundWallet = async () => {
    if (!amount || Number.parseFloat(amount) < 5000) {
      alert("Minimum amount is ₦5,000")
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.initWalletTransaction({ amount: Number.parseFloat(amount), method: "bank_transfer", redirectUrl: window.location.href })
      if (!res.success) {
        setActiveModal("failed")
        throw new Error(res.error || res.message || "Wallet top-up failed")
      }
      const data: any = res.data || {}
      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl
        return
      }
      setBalance((prev) => prev + Number.parseFloat(amount))
      setActiveModal("success")
      setAmount("")
    } catch (error) {
      setActiveModal("failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestFunds = async () => {
    if (!selectedBank) {
      setShowSavedBanks(true)
      return
    }
    if (!amount || Number.parseFloat(amount) < 5000) {
      alert("Minimum amount is ₦5,000")
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.withdrawWallet({ amount: Number.parseFloat(amount), beneficiaryId: String(selectedBank.id || ""), narration: reason })
      if (!res.success) throw new Error(res.error || "Withdraw request failed")
      setActiveModal("requestSuccess")
      setAmount("")
    } catch (error) {
      console.error("Failed to request funds:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayWithCard = async () => {
    if (!amount || Number.parseFloat(amount) < 5000) {
      alert("Minimum amount is ₦5,000")
      return
    }
    setIsLoading(true)
    try {
      const res = await apiClient.initWalletTransaction({ amount: Number.parseFloat(amount), method: "card", redirectUrl: window.location.href })
      if (!res.success) {
        setActiveModal("failed")
        throw new Error(res.error || res.message || "Card payment failed")
      }
      const data: any = res.data || {}
      if (data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl
        return
      }
      setBalance((prev) => prev + Number.parseFloat(amount))
      setActiveModal("success")
      setAmount("")
    } catch (error) {
      setActiveModal("failed")
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <>
      <GlobalSidebar />
      <TopNavigation balance={balance} />

      <div className="relative min-h-screen w-full overflow-hidden pt-16 sm:pt-20">
        {/* Dashboard Background */}
        <Image
          src="/images/dashboard-background.png"
          alt="Dashboard Background"
          fill
          className="object-cover object-center z-0"
          priority
        />
        {/* Main Content Area */}
        <div className="relative z-10 flex items-start justify-center min-h-[calc(100vh-100px)] p-2 sm:p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-7xl">
            {/* Wallet Panel */}
            <div className="bg-green-100/90 border-2 sm:border-4 border-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex-1 w-full lg:max-w-2xl">
              {/* Balance Display */}
              <div className="bg-green-800 text-white rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="text-center">
                  <p className="text-green-200 text-xs sm:text-sm mb-1 sm:mb-2">Balance</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{balance.toFixed(3)}</p>
                </div>
              </div>
              {/* Quick Actions */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-green-900 font-bold mb-2">Quick actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <GameButton onClick={() => setShowSavedBanks(true)} className="w-full">Saved bank details</GameButton>
                  <GameButton onClick={() => setShowLinkModal(true)} className="w-full">Link account</GameButton>
                </div>
              </div>
              {/* Tab Navigation */}
              <div className="flex mb-4 sm:mb-6 border-b-2 border-green-300">
                <button
                  onClick={() => setActiveTab("fund")}
                  className={`flex-1 py-3 px-2 sm:px-4 font-semibold text-sm sm:text-base transition-colors ${
                    activeTab === "fund"
                      ? "text-green-900 border-b-4 border-green-800 -mb-[2px]"
                      : "text-green-700 hover:text-green-900"
                  }`}
                >
                  Fund wallet
                </button>
                <button
                  onClick={() => setActiveTab("request")}
                  className={`flex-1 py-3 px-2 sm:px-4 font-semibold text-sm sm:text-base transition-colors ${
                    activeTab === "request"
                      ? "text-green-900 border-b-4 border-green-800 -mb-[2px]"
                      : "text-green-700 hover:text-green-900"
                  }`}
                >
                  Request funds
                </button>
              </div>
              {/* Fund Wallet Tab */}
              {activeTab === "fund" && (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">
                      Pay to account
                    </label>
                    <div className="p-2 sm:p-3 bg-green-200/50 rounded-lg text-green-900 font-medium text-sm sm:text-base">
                      {accountNumber} [{bankName}]
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">
                        Enter amount
                      </label>
                      <input
                        type="number"
                        min="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="5,000(minimum)"
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">Reason</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="text-center text-green-900 font-semibold text-sm sm:text-base">OR</div>

                  <GameButton onClick={handlePayWithCard} disabled={isLoading} className="w-full">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    Pay with card
                  </GameButton>

                  <GameButton onClick={handleFundWallet} disabled={isLoading} className="w-full">
                    {isLoading ? "Processing..." : "I have completed transfer"}
                  </GameButton>
                </div>
              )}

      {/* Saved Banks Modal */}
      <SavedBanksModal
        open={showSavedBanks}
        onOpenChange={setShowSavedBanks}
        onSelect={(bank) => {
          setSelectedBank(bank)
          setAccountNumber(bank.accountNumber || "")
          setBankName(bank.bankName || bank.bankCode || "")
          setAccountName(bank.accountName || "")
          setShowSavedBanks(false)
        }}
        onAddNew={() => {
          setShowSavedBanks(false)
          setShowLinkModal(true)
        }}
        reloadToken={banksReloadToken}
      />

      {/* Link Bank Modal */}
      <LinkBankModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        onSuccess={() => {
          setBanksReloadToken(Date.now())
          setShowLinkModal(false)
          setShowSavedBanks(true)
        }}
      />
              {/* Request Funds Tab */}
              {activeTab === "request" && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Selected bank summary + change */}
                  <div className="p-3 bg-green-200/50 rounded-lg border border-green-300 flex items-center justify-between">
                    <div className="text-green-900 text-sm">
                      {selectedBank ? (
                        <>
                          <div className="font-bold">{selectedBank.bankName || selectedBank.bankCode || "Bank"}</div>
                          <div>{selectedBank.accountNumber}</div>
                          {selectedBank.accountName && <div className="text-green-700">{selectedBank.accountName}</div>}
                        </>
                      ) : (
                        <div className="text-green-700">No bank selected</div>
                      )}
                    </div>
                    <button className="text-green-800 font-semibold underline text-sm" onClick={() => setShowSavedBanks(true)}>Change</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">
                        Your account
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        readOnly
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">Bank</label>
                      <input
                        type="text"
                        value={bankName}
                        readOnly
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">Account name</label>
                    <input
                      type="text"
                      value={accountName}
                      readOnly
                      className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">
                        Enter amount
                      </label>
                      <input
                        type="number"
                        min="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="10,000"
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-900 font-semibold mb-2 text-sm sm:text-base">Reason</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-2 sm:p-3 text-sm sm:text-base rounded-lg bg-green-200/50 border border-green-300 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <GameButton onClick={handleRequestFunds} disabled={isLoading} className="w-full">
                    {isLoading ? "Processing..." : "I have completed transfer"}
                  </GameButton>
                </div>
              )}
            </div>
            {/* Transaction History Panel */}
            <div className="bg-green-100/90 border-2 sm:border-4 border-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl flex-1 w-full lg:max-w-md">
              <h3 className="text-lg sm:text-xl font-bold text-green-900 text-center mb-4 sm:mb-6">
                Transaction History
              </h3>
              {transactions.length === 0 ? (
                <div className="text-center text-green-800 py-8 sm:py-12">
                  <p className="text-base sm:text-lg font-semibold">No Data Available</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-200/50 rounded-lg"
                    >
                      <span className="w-3 h-3 sm:w-4 sm:h-4 text-green-700 text-sm sm:text-base">&#8250;</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-green-900 font-medium text-sm sm:text-base truncate">
                          {transaction.description}
                        </p>
                        <p className="text-green-700 text-xs sm:text-sm">{transaction.date}</p>
                      </div>
                      <p
                        className={`font-bold text-sm sm:text-base whitespace-nowrap ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}₦{transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {activeModal === "success" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-green-100 border-4 border-green-600 rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <span className="w-5 h-5">&#10003;</span>
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="w-8 h-8 text-white">&#10003;</span>
              </div>
              <h3 className="text-xl font-bold text-green-800">Transaction successful</h3>
              <p className="text-green-700 text-sm">Your transfer has been received and your wallet has been funded</p>
            </div>
          </div>
        </div>
      )}
      {/* Failed Modal */}
      {activeModal === "failed" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-green-100 border-4 border-red-600 rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <span className="w-5 h-5">&#10007;</span>
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
                <span className="w-8 h-8 text-white">&#9785;</span>
              </div>
              <h3 className="text-xl font-bold text-red-800">Transaction Failed</h3>
              <p className="text-red-700 text-sm">
                Your transfer has not being received, confirm your payment once again
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Request Success Modal */}
      {activeModal === "requestSuccess" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-green-100 border-4 border-green-600 rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <span className="w-5 h-5">&#10003;</span>
            </button>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="w-8 h-8 text-white">&#10003;</span>
              </div>
              <h3 className="text-xl font-bold text-green-800">Request successful</h3>
              <p className="text-green-700 text-sm">
                Your request has been received, it will take less than 8 hours to credit your account
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
