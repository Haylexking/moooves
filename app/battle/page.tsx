"use client"

import { BattleGround } from "@/components/game/battle-ground"
import BattlePair from "@/components/game/battle-pair"
import { useState } from "react"

export default function BattlePage() {
  const [showVersus, setShowVersus] = useState(true)
  const [gameMode] = useState<"player-vs-player" | "player-vs-computer">("player-vs-computer")

  const handleMatchStart = () => {
    setShowVersus(false)
  }

  if (showVersus) {
    return <BattlePair onMatchStart={handleMatchStart} />
  }

  return <BattleGround gameMode={gameMode} />
}
