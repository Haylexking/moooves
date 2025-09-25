import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
export interface WalletSlice {
  balance: number;
  isLoading: boolean;
  fetchBalance: () => Promise<void>;
  setBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletSlice>()(
  devtools(
    persist(
      (set) => ({
        balance: 100000, // Mocked value
        isLoading: false,
        fetchBalance: async () => {
          set({ isLoading: true });
          // Simulate API delay
          await new Promise((res) => setTimeout(res, 500));
          set({ balance: 100000, isLoading: false }); // Mocked value
        },
        setBalance: (amount) => set({ balance: amount }),
      }),
      { name: "moooves-wallet" }
    )
  )
);
