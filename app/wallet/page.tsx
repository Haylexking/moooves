"use client"
import { GlobalSidebar } from "@/components/ui/global-sidebar"
import { TopNavigation } from "@/components/ui/top-navigation"
import { LinkBankModal } from "@/components/ui/link-bank-modal"
import { SavedBanksModal } from "@/components/ui/saved-banks-modal"
import { GameButton } from "@/components/ui/game-button"
import { useState } from "react"
import Image from "next/image"

export default function WalletPage() {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showSavedBanks, setShowSavedBanks] = useState(false)
  const [banksReloadToken, setBanksReloadToken] = useState(0)
  return (
    <>
      <GlobalSidebar />
      <TopNavigation />

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
          <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-2xl">
            <div className="bg-green-100/90 border-2 sm:border-4 border-green-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl w-full">
              <h2 className="text-xl font-bold text-green-900 mb-4">Bank Accounts & Payouts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GameButton onClick={() => setShowSavedBanks(true)} className="w-full">Saved bank details</GameButton>
                <GameButton onClick={() => setShowLinkModal(true)} className="w-full">Link account</GameButton>
              </div>
            </div>

            {/* Saved Banks Modal */}
      <SavedBanksModal
        open={showSavedBanks}
        onOpenChange={setShowSavedBanks}
        onSelect={() => setShowSavedBanks(false)}
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
          </div>
        </div>
      </div>
    </>
  )
}
