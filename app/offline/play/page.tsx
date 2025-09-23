"use client"

import { useEffect } from "react"
import { BattleGround } from "@/components/game/battle-ground"
import { useBluetoothConnection } from "@/lib/hooks/use-bluetooth-connection"
import { useWiFiConnection } from "@/lib/hooks/use-wifi-connection"
import { useGameStore } from "@/lib/stores/game-store"
import { useMatchRoom } from "@/lib/hooks/use-match-room"
import type { Player } from "@/lib/types"

export default function OfflinePlayPage() {
    const wifi = useWiFiConnection()
    const bt = useBluetoothConnection()
    const matchRoom = useMatchRoom()
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

    const handleLocalMove = async (row: number, col: number, byPlayer: Player) => {
        // Forward local moves to the connected peer over whichever channel is active
        const payload = { row, col, by: byPlayer }

        try {
            if (matchRoom.roomId) {
                await matchRoom.makeMove({
                    player: byPlayer,
                    position: [row, col],
                    timestamp: Date.now(),
                    sequencesScored: 0,
                })
            }
        } catch (error) {
            console.error("Failed to record move in match room:", error)
        }

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
