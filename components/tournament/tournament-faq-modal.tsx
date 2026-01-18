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
              <li>Hosts set a scheduled start time at creation; players can join until that time.</li>
              <li>If everyone joins early, hosts can hit <strong>Start Now</strong> to begin before the scheduled time.</li>
              <li>When the start time arrives, hosts can start with whoever joined or reschedule to allow more signups.</li>
              <li>Start times are stored in UTC; the UI shows your local time and countdown.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Waiting Room & Attendance</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Each pairing gets a 15-minute window to show up once the match goes live.</li>
              <li>If one player is present and the other is not, the present player wins by default and advances.</li>
              <li>If neither player shows, both forfeit and the draw adjusts automatically.</li>
              <li>Waiting room copy makes the status clear (win by default or forfeit notice).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Communication & Alerts</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>Players can opt into WhatsApp or email alerts during signup.</li>
              <li>Notifications fire when the tournament starts, when a match is live, and for auto wins/forfeits.</li>
              <li>Backend logs deliveries for transparency and uses UTC timestamps to avoid timezone drift.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Gameplay & Results</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
              <li>The dashboard shows your next match with a countdown and opponent info.</li>
              <li>After matches, results clearly state whether you advanced, won by default, or forfeited.</li>
              <li>Hosts can reschedule the tournament start if the player count is not met before kickoff.</li>
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
