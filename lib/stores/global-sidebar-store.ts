import { create } from "zustand"

interface GlobalSidebarState {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useGlobalSidebarStore = create<GlobalSidebarState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))
