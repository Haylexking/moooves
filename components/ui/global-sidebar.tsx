

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Gamepad2,
  Trophy,
  BarChart3,
  Wallet,
  HelpCircle,
  LogOut,
} from "lucide-react";

const menuItems = [
  { icon: Gamepad2, label: "Play game", href: "/dashboard" },
  { icon: Trophy, label: "Tournament", href: "/tournaments" },
  { icon: BarChart3, label: "Statistics", href: "/stats" },
  { icon: Wallet, label: "Wallet", href: "/wallet" },
  { icon: HelpCircle, label: "Need help", href: "/help" },
  { icon: LogOut, label: "Exit game", href: "/" },
];

export function GlobalSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger menu button */}
      {!open && (
        <button
          className="fixed top-6 left-6 z-50 bg-white/90 rounded-lg shadow-lg flex items-center gap-2 px-4 py-2 font-semibold text-gray-800 hover:bg-green-100 transition-colors"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-6 h-6" />
          Menu
        </button>
      )}
      {/* Sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}
      {/* Sidebar */}
      {open && (
        <aside className="fixed top-6 left-6 z-50 flex flex-col gap-4 bg-white/90 rounded-2xl shadow-2xl p-4 border-4 border-green-600 min-w-[220px] max-w-xs">
          {/* Collapse button */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg font-semibold text-gray-800 shadow hover:bg-green-100 transition-colors mb-2"
            onClick={() => setOpen(false)}
          >
            <X className="w-6 h-6" />
            Collapse
          </button>
          {/* Menu items */}
          {menuItems.map((item) => (
            <Link href={item.href} key={item.label} legacyBehavior>
              <a
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold shadow transition-colors text-lg w-full
                  ${item.label === "Play game"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-white text-green-800 hover:bg-green-100"}
                `}
                onClick={() => setOpen(false)}
              >
                {item.icon && React.createElement(item.icon, { className: "w-6 h-6" })}
                {item.label}
              </a>
            </Link>
          ))}
        </aside>
      )}
    </>
  );
// removed extra closing brace
}
