"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import GameRulesModal from "./GameRulesModal"

type GameRulesContextType = {
  openRules: () => void
  closeRules: () => void
  isOpen: boolean
}

const GameRulesContext = createContext<GameRulesContextType | undefined>(undefined)

export function GameRulesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openRules = () => setIsOpen(true)
  const closeRules = () => setIsOpen(false)

  return (
    <GameRulesContext.Provider value={{ openRules, closeRules, isOpen }}>
      {children}
      <GameRulesModal open={isOpen} onOpenChange={(v) => setIsOpen(v)} />
    </GameRulesContext.Provider>
  )
}

export function useGameRules() {
  const ctx = useContext(GameRulesContext)
  if (!ctx) {
    throw new Error("useGameRules must be used inside GameRulesProvider")
  }
  return ctx
}

export default GameRulesProvider
