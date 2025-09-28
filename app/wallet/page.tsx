"use client"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { useState, useEffect } from "react"
import Image from "next/image"

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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch wallet data from backend
    const fetchWalletData = async () => {
      try {
        // This would be the actual API call
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        })
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance || 0)
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
      }
    }
    fetchWalletData()
  }, [])

  const handleFundWallet = async () => {
    if (!amount || Number.parseFloat(amount) < 5000) {
      alert("Minimum amount is ₦5,000")
      return
    }
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // Simulate success/failure (80% success rate)
      const isSuccess = Math.random() > 0.2
      if (isSuccess) {
        setBalance((prev) => prev + Number.parseFloat(amount))
        setActiveModal("success")
        setAmount("")
      } else {
        setActiveModal("failed")
      }
    } catch (error) {
      setActiveModal("failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestFunds = async () => {
    if (!amount || Number.parseFloat(amount) < 5000) {
      alert("Minimum amount is ₦5,000")
      return
    }
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setActiveModal("requestSuccess")
      setAmount("")
    } catch (error) {
      console.error("Failed to request funds:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayWithCard = async () => {
    // Integrate with payment gateway (Paystack/Flutterwave)
    console.log("Initiating card payment...")
    handleFundWallet()
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <>
      <GlobalSidebar />
      <TopNavigation balance={balance} />

      <div className="relative min-h-screen w-full overflow-hidden pt-20">
        {/* Dashboard Background */}
        <Image
          src="/images/dashboard-background.png"
          alt="Dashboard Background"
          fill
          className="object-cover object-center z-0"
          priority
        />
        {/* Main Content Area */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
          <div className="flex gap-6 w-full max-w-6xl">
            {/* Wallet Panel */}
            <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl flex-1 max-w-2xl">
              {/* Balance Display */}
              <div className="bg-green-800 text-white rounded-xl p-6 mb-6">
                <div className="text-center">
                  <p className="text-green-200 text-sm mb-2">Balance</p>
                  <p className="text-4xl font-bold">{balance.toFixed(3)}</p>
                </div>
              </div>
              {/* Tab Navigation */}
              <div className="flex mb-6">
                <button
                  onClick={() => setActiveTab("fund")}
                  className={`flex-1 py-2 px-4 font-semibold transition-colors ${activeTab === "fund"
                      ? "text-green-800 border-b-2 border-green-800"
                      : "text-gray-600 hover:text-green-700"
                    }`}
                >
                  Fund wallet
                </button>
                <button
                  onClick={() => setActiveTab("request")}
                  className={`flex-1 py-2 px-4 font-semibold transition-colors ${activeTab === "request"
                      ? "text-green-800 border-b-2 border-green-800"
                      : "text-gray-600 hover:text-green-700"
                    }`}
                >
                  Request funds
                </button>
              </div>
              {/* Fund Wallet Tab */}
              {activeTab === "fund" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-green-800 font-semibold mb-2">Pay to account</label>
                    <div className="p-3 bg-green-200/50 rounded-lg text-green-800 font-medium">
                      {accountNumber} [{bankName}]
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Enter amount</label>
                      <input
                        type="number"
                        min="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="5,000(minimum)"
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Reason</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="text-center text-green-800 font-semibold">OR</div>

                  <button
                    onClick={handlePayWithCard}
                    disabled={isLoading}
                    className="w-full p-3 bg-white border border-green-300 rounded-lg text-green-800 font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">MC</span>
                    </div>
                    Pay with card
                  </button>

                  <button
                    onClick={handleFundWallet}
                    disabled={isLoading}
                    className="w-full p-3 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "I have completed transfer"}
                  </button>
                </div>
              )}
              {/* Request Funds Tab */}
              {activeTab === "request" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Your account</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Bank</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Enter amount</label>
                      <input
                        type="number"
                        min="5000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="10,000"
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 placeholder-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-green-800 font-semibold mb-2">Reason</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 rounded-lg bg-green-200/50 border border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRequestFunds}
                    disabled={isLoading}
                    className="w-full p-3 bg-green-800 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Processing..." : "I have completed transfer"}
                  </button>
                </div>
              )}
            </div>
            {/* Transaction History Panel */}
            <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl flex-1 max-w-md">
              <h3 className="text-xl font-bold text-green-800 text-center mb-6">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center text-green-700 py-12">
                  <p className="text-lg font-semibold">No Data Available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-3 p-3 bg-green-200/50 rounded-lg">
                      <span className="w-4 h-4 text-green-700">&#8250;</span>
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">{transaction.description}</p>
                        <p className="text-green-600 text-sm">{transaction.date}</p>
                      </div>
                      <p className={`font-bold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}>
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
