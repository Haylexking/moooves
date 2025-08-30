"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { TournamentSlice } from "./slices/tournament-slice"
import { createTournamentSlice } from "./slices/tournament-slice"

export const useTournamentStore = create<TournamentSlice>()(
  devtools(createTournamentSlice, { name: "tournament-store" }),
)
