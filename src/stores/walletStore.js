import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateMnemonic, deriveAllWallets, validateMnemonic, walletFromPrivateKey, encryptData, decryptData } from '../utils/wallet'
import { DEFAULT_TOKENS } from '../config/chains'

const useWalletStore = create(
  persist(
    (set, get) => ({
      // State
      initialized: false,
      wallets: [],          // Array of wallet objects
      activeWalletId: null,  // ID of the currently active wallet
      customTokens: [],      // User-added tokens
      balances: {},          // { [walletId]: { [tokenKey]: string } }
      balancesLoading: false,

      // Actions
      createWallet: (name = 'Main Wallet') => {
        const mnemonic = generateMnemonic()
        const addresses = deriveAllWallets(mnemonic, 0)
        const id = `wallet_${Date.now()}`
        const wallet = {
          id,
          name,
          mnemonic: encryptData(mnemonic),
          addresses,
          accountIndex: 0,
          createdAt: Date.now(),
        }
        set(state => ({
          wallets: [...state.wallets, wallet],
          activeWalletId: state.activeWalletId || id,
          initialized: true,
        }))
        return { id, mnemonic, addresses }
      },

      importWalletFromMnemonic: (mnemonic, name = 'Imported Wallet') => {
        if (!validateMnemonic(mnemonic)) return null
        const addresses = deriveAllWallets(mnemonic, 0)
        const id = `wallet_${Date.now()}`
        const wallet = {
          id,
          name,
          mnemonic: encryptData(mnemonic),
          addresses,
          accountIndex: 0,
          createdAt: Date.now(),
        }
        set(state => ({
          wallets: [...state.wallets, wallet],
          activeWalletId: id,
          initialized: true,
        }))
        return { id, addresses }
      },

      importWalletFromPrivateKey: (privateKey, name = 'Imported Wallet') => {
        const result = walletFromPrivateKey(privateKey)
        if (!result) return null
        const id = `wallet_${Date.now()}`
        const wallet = {
          id,
          name,
          mnemonic: null,
          addresses: {
            ethereum: result,
            bsc: result,
            tron: result,
          },
          accountIndex: 0,
          createdAt: Date.now(),
        }
        set(state => ({
          wallets: [...state.wallets, wallet],
          activeWalletId: id,
          initialized: true,
        }))
        return { id, addresses: wallet.addresses }
      },

      setActiveWallet: (id) => set({ activeWalletId: id }),

      renameWallet: (id, name) => set(state => ({
        wallets: state.wallets.map(w => w.id === id ? { ...w, name } : w),
      })),

      deleteWallet: (id) => set(state => {
        const wallets = state.wallets.filter(w => w.id !== id)
        return {
          wallets,
          activeWalletId: state.activeWalletId === id
            ? (wallets[0]?.id || null)
            : state.activeWalletId,
          initialized: wallets.length > 0,
        }
      }),

      getActiveWallet: () => {
        const { wallets, activeWalletId } = get()
        return wallets.find(w => w.id === activeWalletId) || null
      },

      getMnemonic: (walletId) => {
        const wallet = get().wallets.find(w => w.id === walletId)
        if (!wallet?.mnemonic) return null
        return decryptData(wallet.mnemonic)
      },

      addCustomToken: (token) => set(state => {
        // Check if already in DEFAULT_TOKENS by symbol (case-insensitive)
        const isDefault = DEFAULT_TOKENS.some(d =>
          d.symbol.toLowerCase() === token.symbol.toLowerCase() && d.chain === token.chain
        )
        if (isDefault) return {} // Don't add duplicates of default tokens

        // Remove any existing duplicate by contract+chain, coingeckoId (any chain), or symbol+chain
        const filtered = state.customTokens.filter(t => {
          if (token.contractAddress && t.contractAddress) {
            if (t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase() && t.chain === token.chain) return false
          }
          if (token.coingeckoId && t.coingeckoId && t.coingeckoId === token.coingeckoId) return false
          if (t.symbol.toLowerCase() === token.symbol.toLowerCase() && t.chain === token.chain) return false
          return true
        })
        return { customTokens: [...filtered, token] }
      }),

      removeCustomToken: (token) => set(state => ({
        customTokens: state.customTokens.filter(t => {
          if (token.contractAddress && t.contractAddress) {
            if (t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase() && t.chain === token.chain) return false
          }
          if (token.coingeckoId && t.coingeckoId && t.coingeckoId === token.coingeckoId) return false
          if (t.symbol.toLowerCase() === token.symbol.toLowerCase() && t.chain === token.chain) return false
          return true
        }),
      })),

      getAllTokens: () => {
        const { customTokens } = get()
        return [...DEFAULT_TOKENS, ...customTokens]
      },

      setBalances: (walletId, balances) => set(state => ({
        balances: { ...state.balances, [walletId]: balances },
      })),

      setBalancesLoading: (loading) => set({ balancesLoading: loading }),
    }),
    {
      name: 'urban-wallet-storage',
      partialize: (state) => ({
        wallets: state.wallets,
        activeWalletId: state.activeWalletId,
        customTokens: state.customTokens,
        initialized: state.initialized,
      }),
    }
  )
)

export default useWalletStore
