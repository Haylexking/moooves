"use client"

import { useEffect } from "react"
import { BattleGround } from "@/components/game/battle-ground"
import { useBluetoothConnection } from "@/lib/hooks/use-bluetooth-connection"
import { useWiFiConnection } from "@/lib/hooks/use-wifi-connection"
import { useGameStore } from "@/lib/stores/game-store"
import type { Player } from "@/lib/types"

export default function OfflinePlayPage() {
    const wifi = useWiFiConnection()
    const bt = useBluetoothConnection()
    const { makeMove, gameStatus } = useGameStore()

    useEffect(() => {
        // Receive moves from peer and apply locally
        const offWifi = wifi.onMessage("move", (move: { row: number; col: number }) => {
            if (gameStatus === "playing") {
                makeMove(move.row, move.col)
            }
        })

        const offBt = bt.onMessage("move", (move: { row: number; col: number }) => {
            if (gameStatus === "playing") {
                makeMove(move.row, move.col)
            }
        })

        return () => {
            offWifi?.()
            offBt?.()
        }
    }, [wifi, bt, makeMove, gameStatus])

    const handleLocalMove = (row: number, col: number, byPlayer: Player) => {
        // Forward local moves to the connected peer over whichever channel is active
        const payload = { row, col, by: byPlayer }
        if (wifi.isConnected) {
            void wifi.sendMessage("move", payload)
        } else if (bt.isConnected) {
            void bt.sendMessage("move", payload)
        }
    }

    return (
        <div className="min-h-screen">
            <BattleGround player2="OFFLINE PEER" gameMode="player-vs-player" onMoveMade={handleLocalMove} />
        </div>
    )
}


