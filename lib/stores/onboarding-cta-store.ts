import { create } from "zustand";

interface OnboardingCtaState {
  ctaText: string;
  setCtaText: (text: string) => void;
  clearCtaText: () => void;
}

export const useOnboardingCtaStore = create<OnboardingCtaState>((set) => ({
  ctaText: "",
  setCtaText: (text) => set({ ctaText: text }),
  clearCtaText: () => set({ ctaText: "" }),
}));
