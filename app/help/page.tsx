"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Menu,
  X,
  Plus,
  User,
  Settings,
  Gamepad2,
  Trophy,
  BarChart3,
  Wallet,
  HelpCircle,
  LogOut,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

type TabType = "faqs" | "support"

export default function HelpPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("faqs")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(2) // Third FAQ expanded by default

  const menuItems = [
    { icon: Gamepad2, label: "Play game", href: "/dashboard" },
    { icon: Trophy, label: "Tournament", href: "/tournaments" },
    { icon: BarChart3, label: "Statistics", href: "/stats" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: HelpCircle, label: "Need help", href: "/help", active: true },
    { icon: LogOut, label: "Exit game", href: "/" },
  ]

  const faqs = [
    {
      question: "How do I join a tournament?",
      answer:
        "To join a tournament, you need an invite code from the tournament host. Enter the code in the tournament section and complete the payment process.",
    },
    {
      question: "What is the minimum entry fee?",
      answer:
        "The minimum entry fee for tournaments is ₦1,000 per player. This ensures a meaningful prize pool for all participants.",
    },
    {
      question: "How is the prize pool shared?",
      answer:
        "The prize pool is distributed as follows:\n• Host: 50% of the pool\n• Winners (Top 3): 40% (1st: 20%, 2nd: 12%, 3rd: 8%)\n• Platform: 10% (service fee)",
    },
    {
      question: "How many players can participate in a tournament?",
      answer:
        "Tournaments can have between 6 to 50 players. The minimum ensures competitive gameplay while the maximum maintains manageable tournament size.",
    },
    {
      question: "What is the minimum pool size for a tournament?",
      answer:
        "The minimum total prize pool for a tournament is ₦100,000. This ensures substantial rewards for winners and hosts.",
    },
    {
      question: "How do I pay the entry fee?",
      answer:
        "You can pay entry fees using your card or bank transfer through our secure payment partners Flutterwave and Paystack.",
    },
    {
      question: "How do winners get their rewards?",
      answer:
        "Winners receive their rewards automatically after tournament completion. Payouts are processed within 24-48 hours to your registered payment method.",
    },
  ]

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Dashboard Background */}
      <Image
        src="/images/dashboard-background.png"
        alt="Dashboard Background"
        fill
        className="object-cover object-center z-0"
        priority
      />

      {/* Side Menu */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-sm z-40 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-2">
          {/* Collapse Button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
          >
            <X className="w-5 h-5" />
            Collapse
          </button>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => (window.location.href = item.href)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg font-semibold transition-colors ${
                item.active
                  ? "bg-green-200 text-green-800"
                  : "bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setIsMenuOpen(false)} />}

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between p-4">
        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors shadow-lg"
        >
          <Menu className="w-5 h-5" />
          Menu
        </button>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs">₦</span>
            </div>
            100,000
            <Plus className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <User className="w-5 h-5" />
            USER 002
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-bold shadow-lg">
            <User className="w-5 h-5" />
            {typeof window !== "undefined" && window.localStorage.getItem("username") ? window.localStorage.getItem("username") : "User"}
          </div>
          {/* Notification Bell */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/90 text-gray-800 hover:bg-white transition-colors shadow-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
        <div className="w-full max-w-4xl">
          {/* Help Panel */}
          <div className="bg-green-100/90 border-4 border-green-600 rounded-2xl p-6 shadow-2xl">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-green-200/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("faqs")}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    activeTab === "faqs" ? "bg-green-600 text-white shadow-md" : "text-green-800 hover:bg-green-300/50"
                  }`}
                >
                  FAQs
                </button>
                <button
                  onClick={() => setActiveTab("support")}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    activeTab === "support"
                      ? "bg-green-600 text-white shadow-md"
                      : "text-green-800 hover:bg-green-300/50"
                  }`}
                >
                  Support
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-green-200/30 rounded-lg p-6 min-h-[400px]">
              {activeTab === "faqs" && (
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="bg-green-100/50 rounded-lg border border-green-300/50">
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-green-200/30 transition-colors"
                      >
                        <span className="font-semibold text-green-800">{faq.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4">
                          <div className="text-green-700 text-sm whitespace-pre-line">{faq.answer}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "support" && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-6">
                  <div className="space-y-4">
                    <div className="bg-green-100/50 rounded-lg p-6 max-w-md">
                      <h3 className="font-bold text-green-800 mb-3">Email Support</h3>
                      <p className="text-green-700 text-sm mb-2">
                        Reach us at <span className="font-semibold">support@yourapp1.com</span>
                      </p>
                      <p className="text-green-700 text-sm">for detailed assistance.</p>
                    </div>

                    <div className="bg-green-100/50 rounded-lg p-6 max-w-md">
                      <h3 className="font-bold text-green-800 mb-3">FAQs</h3>
                      <p className="text-green-700 text-sm">
                        Browse our Frequently Asked Questions for instant solutions.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
