import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TokenState {
  tokens: number;
  isFirstPurchase: boolean;
  useToken: () => boolean;
  addTokens: (amount: number) => void;
  setFirstPurchaseDone: () => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: 999, // Default tokens for new users
      isFirstPurchase: true,
      useToken: () => {
        const currentTokens = get().tokens;
        if (currentTokens > 0) {
          set({ tokens: currentTokens - 1 });
          return true;
        }
        return false;
      },
      addTokens: (amount) => set((state) => ({ tokens: state.tokens + amount })),
      setFirstPurchaseDone: () => set({ isFirstPurchase: false }),
    }),
    {
      name: 'token-storage',
    }
  )
);