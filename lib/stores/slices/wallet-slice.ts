import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
export interface WalletSlice {
  balance: number;
  isLoading: boolean;
  transactions: Array<{ id: string; amount: number; type: 'deposit' | 'withdraw'; date: number }>;
  fetchBalance: () => Promise<void>;
  setBalance: (amount: number) => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  fetchTransactions: () => Promise<void>;
}

export const useWalletStore = create<WalletSlice>()(
  devtools(
    persist(
      (set) => ({
        balance: 0,
        isLoading: false,
        transactions: [],
        fetchBalance: async () => {
          set({ isLoading: true });
          try {
            // Placeholder for real API call
            // const res = await fetch("/api/v1/wallet/balance", { credentials: "include" });
            // if (!res.ok) throw new Error("Failed to fetch wallet balance");
            // const data = await res.json();
            // set({ balance: data.balance, isLoading: false });
            await new Promise((res) => setTimeout(res, 500));
            set({ balance: 100000, isLoading: false }); // Mocked value
          } catch (error) {
            set({ isLoading: false });
          }
        },
        setBalance: (amount) => set({ balance: amount }),
        deposit: async (amount) => {
          set({ isLoading: true });
          try {
            // Placeholder for real API call
            await new Promise((res) => setTimeout(res, 500));
            set((state) => ({
              balance: state.balance + amount,
              transactions: [
                { id: `tx-${Date.now()}`, amount, type: 'deposit', date: Date.now() },
                ...state.transactions,
              ],
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
          }
        },
        withdraw: async (amount) => {
          set({ isLoading: true });
          try {
            // Placeholder for real API call
            await new Promise((res) => setTimeout(res, 500));
            set((state) => ({
              balance: state.balance - amount,
              transactions: [
                { id: `tx-${Date.now()}`, amount, type: 'withdraw', date: Date.now() },
                ...state.transactions,
              ],
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
          }
        },
        fetchTransactions: async () => {
          set({ isLoading: true });
          try {
            // Placeholder for real API call
            await new Promise((res) => setTimeout(res, 500));
            set({
              transactions: [
                { id: 'tx-1', amount: 5000, type: 'deposit', date: Date.now() - 86400000 },
                { id: 'tx-2', amount: 2000, type: 'withdraw', date: Date.now() - 43200000 },
              ],
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
          }
        },
      }),
      { name: "moooves-wallet" }
    )
  )
);
