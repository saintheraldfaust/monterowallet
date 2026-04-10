import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      currency: 'USD',
      currencySymbol: '$',
      hideBalances: false,
      biometricEnabled: false,

      toggleTheme: () => set(state => {
        const next = state.theme === 'dark' ? 'light' : 'dark'
        document.body.className = next
        return { theme: next }
      }),

      setTheme: (theme) => {
        document.body.className = theme
        set({ theme })
      },

      setCurrency: (code, symbol) => set({ currency: code, currencySymbol: symbol }),

      toggleHideBalances: () => set(state => ({ hideBalances: !state.hideBalances })),

      initTheme: () => {
        const stored = JSON.parse(localStorage.getItem('urban-wallet-settings') || '{}')
        const theme = stored?.state?.theme || 'dark'
        document.body.className = theme
        set({ theme })
      },
    }),
    {
      name: 'urban-wallet-settings',
    }
  )
)

export default useSettingsStore
