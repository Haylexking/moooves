"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface TournamentFAQModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TournamentFAQModal({ open, onOpenChange }: TournamentFAQModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-green-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-500 flex items-center gap-2">
            <HelpCircle className="w-6 h-6" />
            Tournament Rules & FAQ
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            The final tournament flow for scheduling, waiting rooms, notifications, and results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Scheduling & Start Control</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Hosts set a scheduled start time at creation. Players can join up until that time.</li>
              <li>If all players join early, the host can manually <strong>Start Now</strong>.</li>
              <li>If the player count isn't reached by start time, the host can extend the time or start with current players.</li>
              <li>Timestamps are UTC-based but displayed in your local time.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Waiting Room & Attendance</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Once the tournament starts, each match has a **15-minute waiting window**.</li>
              <li><strong>Win by Default:</strong> If your opponent doesn't show up within 15 minutes, you automatically advance.</li>
              <li><strong>Forfeit:</strong> If you don't show up, you forfeit the match. If neither shows, both forfeit.</li>
              <li>Look for status messages like "Opponent hasn't shown up — you win by default".</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Communication & Alerts</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Opt-in to <strong>WhatsApp/Email notifications</strong> during signup to get alerts.</li>
              <li>We'll notify you when the tournament starts, when your match is live, and if you advance automatically.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Gameplay & Results</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>The dashboard shows your next match with a live countdown.</li>
              <li>Matches are Single Elimination. Losing a match means you are out of the tournament.</li>
              <li>Results will clearly state if you won, lost, or advanced due to a no-show.</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="bg-green-600 hover:bg-green-700 text-white">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
