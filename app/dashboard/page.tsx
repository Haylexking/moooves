"use client"



import { GlobalSidebar } from "@/components/ui/global-sidebar";
import { Wallet, User, Bell, Settings } from "lucide-react";
import { useState } from "react";

export default function DashboardPage() {
  // Mock data for wallet and user
  const [balance] = useState(100000);
  const [username] = useState("USER 002");

  return (
    <>
      <GlobalSidebar />
      {/* Top nav bar */}
      <div className="fixed top-6 right-6 z-40 flex gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 font-bold text-green-800 shadow">
          <Wallet className="w-5 h-5 mr-1" />
          {balance.toLocaleString()}
          <span className="ml-1 text-green-800 font-bold">₦</span>
          <span className="ml-2 text-green-600 font-bold">+</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 font-bold text-green-800 shadow">
          <User className="w-5 h-5 mr-1" />
          {username}
        </div>
        <button className="bg-white rounded-lg p-2 shadow">
          <Bell className="w-5 h-5 text-green-800" />
        </button>
        <button className="bg-white rounded-lg p-2 shadow">
          <Settings className="w-5 h-5 text-green-800" />
        </button>
      </div>
      {/* Centered buttons */}
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col gap-6 mt-24">
          <button className="px-8 py-3 rounded-lg bg-gradient-to-b from-gray-300 to-gray-700 text-white text-xl font-bold shadow-lg hover:scale-105 transition-transform">
            Start game
          </button>
          <button className="px-8 py-3 rounded-lg bg-gradient-to-b from-gray-300 to-gray-700 text-white text-xl font-bold shadow-lg hover:scale-105 transition-transform">
            Game rules
          </button>
        </div>
      </div>
    </>
  );
}
