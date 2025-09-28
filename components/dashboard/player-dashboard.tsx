import React, { useState } from "react";
import { useAuthStore } from "../../lib/stores/auth-store";
import { useTournamentStore } from "../../lib/stores/tournament-store";
import { GameButton } from "../ui/game-button";
import { GlobalSidebar } from "../ui/global-sidebar";
import { X, Copy } from "lucide-react";

export function PlayerDashboard() {
  const { user } = useAuthStore();
  const { userTournaments } = useTournamentStore();
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [joinTournamentCode, setJoinTournamentCode] = useState("");

  const canCreateTournament = userTournaments && userTournaments.length >= 3;

  const handleStartGame = () => {};
  const handleGameRules = () => setActiveModal("gameRules");
  const handlePlay1v1 = () => {
    setSelectedGameMode("1v1");
    setSelectedGameType(null);
  };
  const handleStartTournament = () => setActiveModal("createTournament");
  const closeModal = () => setActiveModal(null);

  return (
    <>
      <div className="flex min-h-screen">
        <GlobalSidebar />
        <main className="flex-1 p-4">
          <div className="flex flex-col items-center gap-4">
            {selectedGameMode === "1v1" && !selectedGameType ? (
              <>
                <GameButton onClick={() => setSelectedGameType("player-vs-player")} className="w-64">
                  Player vs Player
                </GameButton>
                <GameButton onClick={() => setSelectedGameType("player-vs-computer")} className="w-64">
                  Player vs PC
                </GameButton>
                <button
                  onClick={() => setSelectedGameType(null)}
                  className="mt-4 text-white/80 hover:text-white text-sm underline"
                >
                  ← Back
                </button>
              </>
            ) : selectedGameMode === "1v1" && selectedGameType ? (
              <>
                <GameButton onClick={handleStartGame} className="w-64">
                  Start game
                </GameButton>
                <GameButton onClick={handleGameRules} className="w-64">
                  Game rules
                </GameButton>
                <button
                  onClick={() => setSelectedGameType(null)}
                  className="mt-4 text-white/80 hover:text-white text-sm underline"
                >
                  ← Back
                </button>
              </>
            ) : selectedGameMode === "tournament" ? (
              <>
                <GameButton onClick={handlePlay1v1} className="w-64">
                  Play 1v1
                </GameButton>
                {canCreateTournament && (
                  <GameButton onClick={handleStartTournament} className="w-64">
                    Start tournament
                  </GameButton>
                )}
                <GameButton onClick={() => setActiveModal("joinTournament")} className="w-64">
                  Join tournament
                </GameButton>
                <button
                  onClick={() => setSelectedGameMode(null)}
                  className="mt-4 text-white/80 hover:text-white text-sm underline"
                >
                  ← Back
                </button>
              </>
            ) : (
              <>
                <GameButton onClick={handlePlay1v1} className="w-64">
                  Play 1v1
                </GameButton>
                {canCreateTournament && (
                  <GameButton onClick={() => setSelectedGameMode("tournament")} className="w-64">
                    Start tournament
                  </GameButton>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      {activeModal === "joinTournament" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-2xl p-6 w-full max-w-md border-4 border-green-600 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-green-800">Input tournament link or code</h2>
              <p className="text-green-700 text-center text-sm mb-4">Input link to tournament you wish to join</p>
              <div className="flex items-center gap-2 bg-green-200/50 border border-green-300 rounded-lg px-4 py-3">
                <Copy className="w-5 h-5 text-green-700" />
                <input
                  type="text"
                  value={joinTournamentCode}
                  onChange={(e) => setJoinTournamentCode(e.target.value)}
                  placeholder="Moooves.te001"
                  className="flex-1 bg-transparent outline-none text-green-800 font-semibold placeholder-green-600"
                />
                <GameButton
                  onClick={() => {
                    const code = joinTournamentCode.trim().toLowerCase();
                    if (!code || code.length < 8) setActiveModal("invalidLink");
                    else if (code === "filled001") setActiveModal("tournamentFilled");
                    else if (code === "lowbal001") setActiveModal("lowBalance");
                    else if (code === "moooves.te001") setActiveModal("tournamentFound");
                    else setActiveModal("invalidLink");
                  }}
                >
                  Join
                </GameButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
