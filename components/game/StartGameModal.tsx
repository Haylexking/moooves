"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { GameButton } from '@/components/ui/game-button'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/stores/game-store'

export default function StartGameModal({
  open = true,
  onOpenChange = () => {},
}: {
  open?: boolean
  onOpenChange?: (v: boolean) => void
}) {
  const router = useRouter()
  const [view, setView] = useState<'main'|'p2p'>('main')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'ai'|'p2p'|null>('ai')
  const startNewGame = useGameStore((s: any) => (s.startNewGame || s.startGame || (() => {})))
  const setServerAuthoritative = (val: boolean) => useGameStore.setState({ serverAuthoritative: val })

  const launchAi = () => {
    startNewGame()
    onOpenChange(false)
    router.push('/game?mode=ai')
  }

  const openTournament = () => {
    onOpenChange(false)
    router.push('/tournaments')
  }

  const startLocalP2P = () => {
    // Mock local P2P: show connecting for 2s then connected -> navigate with state
    setConnecting(true)
    setServerAuthoritative(false)
    setTimeout(() => {
      setConnecting(false)
      setConnected(true)
      // navigate to game with p2p mode and connection info
      onOpenChange(false)
      // Use query params to indicate connection type
      router.push('/game?mode=p2p&connection=local')
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Game</DialogTitle>
          <DialogDescription>Choose how you want to play</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence initial={false} mode="wait">
            {view === 'main' && (
              <motion.div key="main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="flex flex-col gap-3">
                  <GameButton onClick={launchAi} aria-label="Play vs Computer">Play vs Computer</GameButton>
                  <GameButton onClick={openTournament} aria-label="Join Tournament">Join Tournament</GameButton>
                  <GameButton onClick={() => setView('p2p')} aria-label="Nearby Player">Nearby Player</GameButton>
                </div>
              </motion.div>
            )}

            {view === 'p2p' && (
              <motion.div key="p2p" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="flex flex-col gap-3">
                  <div className="text-sm">Nearby (WiFi / Bluetooth)</div>
                  {!connecting && !connected && (
                    <>
                      <GameButton onClick={startLocalP2P}>Nearby</GameButton>
                      <GameButton variant="pressed" onClick={() => setView('main')}>Back</GameButton>
                    </>
                  )}

                  {connecting && <div className="px-3 py-2">Connecting...</div>}
                  {connected && <div className="px-3 py-2">Connected to Player!</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { StartGameModal }
