import { useState, useEffect, useCallback } from 'react'
import { getNativeBalance, getTokenBalance } from '../utils/wallet'
import { CHAINS, DEFAULT_TOKENS } from '../config/chains'
import useWalletStore from '../stores/walletStore'

export function useBalances() {
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(false)
  const wallet = useWalletStore(s => s.getActiveWallet())
  const customTokens = useWalletStore(s => s.customTokens)
  const allTokens = [...DEFAULT_TOKENS, ...customTokens]

  const fetchBalances = useCallback(async () => {
    if (!wallet) return
    setLoading(true)
    const result = {}

    try {
      const promises = allTokens.map(async (token) => {
        const chain = CHAINS[token.chain]
        if (!chain || chain.evmCompatible === false) return // Skip non-EVM chains (e.g. Tron)
        const address = wallet.addresses[token.chain]?.address
        if (!address) return

        const key = token.contractAddress
          ? `${token.chain}:${token.contractAddress}`
          : `${token.chain}:native`

        try {
          if (token.isNative) {
            const bal = await getNativeBalance(chain.rpc, address)
            result[key] = bal
          } else if (token.contractAddress) {
            const bal = await getTokenBalance(chain.rpc, token.contractAddress, address, token.decimals)
            result[key] = bal
          }
        } catch {
          result[key] = '0'
        }
      })

      await Promise.allSettled(promises)
    } catch {
      // fail silently
    }

    setBalances(result)
    setLoading(false)
  }, [wallet?.id, customTokens.length])

  useEffect(() => {
    fetchBalances()
    const interval = setInterval(fetchBalances, 30000)
    return () => clearInterval(interval)
  }, [fetchBalances])

  const getBalance = (token) => {
    const key = token.contractAddress
      ? `${token.chain}:${token.contractAddress}`
      : `${token.chain}:native`
    return balances[key] || '0'
  }

  return { balances, loading, getBalance, refresh: fetchBalances }
}
