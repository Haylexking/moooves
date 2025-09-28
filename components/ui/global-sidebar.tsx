"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X, Gamepad2, Trophy, BarChart3, Wallet, HelpCircle, LogOut } from "lucide-react"

const menuItems = [
  { icon: Gamepad2, label: "Play game", href: "/dashboard" },
  { icon: Trophy, label: "Tournament", href: "/tournaments" },
  { icon: BarChart3, label: "Statistics", href: "/stats" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: HelpCircle, label: "Need help", href: "/help" },
  { icon: LogOut, label: "Exit game", href: "/" },
]

export function GlobalSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          className="fixed top-6 left-6 z-50 bg-white/90 rounded-lg shadow-lg flex items-center gap-2 px-4 py-2 font-semibold text-gray-800 hover:bg-white transition-colors"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-5 h-5" />
          Menu
        </button>
      )}

      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {open && (
        <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-sm z-50 transform transition-transform duration-300 translate-x-0">
          <div className="p-4 space-y-2">
            {/* Collapse Button */}
            <button
              className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/90 text-gray-800 font-semibold hover:bg-green-100 hover:text-green-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <X className="w-5 h-5" />
              Collapse
            </button>

            {/* Menu Items */}
            {menuItems.map((item) => (
              <Link href={item.href} key={item.label} legacyBehavior>
                <a
                  className="flex items-center gap-3 w-full p-3 rounded-lg font-semibold transition-colors bg-white/90 text-gray-800 hover:bg-green-100 hover:text-green-800"
                  onClick={() => setOpen(false)}
                >
                  {item.icon && React.createElement(item.icon, { className: "w-5 h-5" })}
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </>
  )
}
