import { useState, useEffect, useCallback, useRef } from 'react'
import useWalletStore from '../stores/walletStore'
import { CHAINS } from '../config/chains'

const MORALIS_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImI2ZWM4MjhkLWRjNGItNDg0Mi1hOTY4LTFkZjE3ZDcyZTk0MiIsIm9yZ0lkIjoiNTA5MTIxIiwidXNlcklkIjoiNTIzODM2IiwidHlwZUlkIjoiZTZkZjZkYzItNmUxNS00YjMzLThlMjktMzg3ZTI4MDM1ZWFiIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NzU4NTM1NzQsImV4cCI6NDkzMTYxMzU3NH0.RkXGcBHZ2vpocgxM0JfHRj1JSvMNof-mFCYc5BreZ1E'
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const LS_KEY = 'uw_tx_cache'

// Persistent cache: localStorage + in-memory
function loadCache() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveCache(cache) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cache)) } catch {}
}
let memCache = loadCache()

/**
 * Fetch recent transactions for the active wallet.
 * Only fetches on mount or manual refresh. Uses localStorage cache.
 */
export function useTransactions(limit = 15) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const wallet = useWalletStore(s => s.getActiveWallet())
  const fetchedRef = useRef(false)
  const walletIdRef = useRef(null)

  const fetchTxs = useCallback(async (force = false) => {
    if (!wallet) return

    const evmChains = [
      { id: 'bsc', address: wallet.addresses?.bsc?.address, chain: 'bsc', explorer: 'https://bscscan.com' },
      { id: 'ethereum', address: wallet.addresses?.ethereum?.address, chain: 'eth', explorer: 'https://etherscan.io' },
    ]

    // Check if ALL chains are cached
    const allCached = []
    let needsFetch = false
    for (const chain of evmChains) {
      if (!chain.address) continue
      const key = `${chain.id}:${chain.address}`
      const entry = memCache[key]
      if (!force && entry && Date.now() - entry.time < CACHE_TTL) {
        allCached.push(...entry.data)
      } else {
        needsFetch = true
        break
      }
    }

    // If everything was cached, just use it
    if (!needsFetch && allCached.length > 0) {
      allCached.sort((a, b) => b.timeStamp - a.timeStamp)
      setTransactions(allCached.slice(0, limit))
      return
    }

    setLoading(true)
    const allTxs = []

    // Fetch chains sequentially to be gentle on API
    for (const chain of evmChains) {
      if (!chain.address) continue
      const cacheKey = `${chain.id}:${chain.address}`

      // Still use cache per-chain if valid
      if (!force && memCache[cacheKey] && Date.now() - memCache[cacheKey].time < CACHE_TTL) {
        allTxs.push(...memCache[cacheKey].data)
        continue
      }

      try {
        const url = `https://deep-index.moralis.io/api/v2.2/wallets/${chain.address}/history?chain=${chain.chain}&order=DESC&limit=${limit}`
        const res = await fetch(url, {
          headers: { 'X-API-Key': MORALIS_KEY, 'accept': 'application/json' }
        })

        if (res.status === 429) {
          console.warn('Moralis rate limited, using cached data')
          if (memCache[cacheKey]) allTxs.push(...memCache[cacheKey].data)
          continue
        }

        const data = await res.json()
        if (!data?.result) continue

        const txs = data.result.map(tx => {
          const isSend = tx.from_address?.toLowerCase() === chain.address.toLowerCase()
          const erc20 = tx.erc20_transfers?.[0]
          const native = tx.native_transfers?.[0]
          const isErc20 = !!erc20

          return {
            hash: tx.hash,
            from: tx.from_address?.toLowerCase(),
            to: tx.to_address?.toLowerCase(),
            value: isErc20 ? erc20.value : (native?.value || tx.value || '0'),
            tokenSymbol: isErc20 ? erc20.token_symbol : (chain.id === 'bsc' ? 'BNB' : 'ETH'),
            tokenDecimal: isErc20 ? Number(erc20.token_decimals) : 18,
            contractAddress: isErc20 ? erc20.address?.toLowerCase() : null,
            timeStamp: new Date(tx.block_timestamp).getTime() / 1000,
            gasUsed: tx.receipt_gas_used,
            gasPrice: tx.gas_price,
            isError: tx.receipt_status === '0',
            chain: chain.id,
            chainName: CHAINS[chain.id]?.name || chain.id,
            explorer: chain.explorer,
            isSend,
            isErc20,
            summary: tx.summary || '',
          }
        }).slice(0, limit)

        memCache[cacheKey] = { data: txs, time: Date.now() }
        saveCache(memCache)
        allTxs.push(...txs)
      } catch (e) {
        console.error(`Failed to fetch ${chain.id} txs`, e)
        if (memCache[cacheKey]) allTxs.push(...memCache[cacheKey].data)
      }
    }

    allTxs.sort((a, b) => b.timeStamp - a.timeStamp)
    setTransactions(allTxs.slice(0, limit))
    setLoading(false)
  }, [wallet?.id, limit])

  // Only fetch once per wallet, not on every render
  useEffect(() => {
    const wid = wallet?.id
    if (!wid) return
    if (fetchedRef.current && walletIdRef.current === wid) return
    fetchedRef.current = true
    walletIdRef.current = wid
    fetchTxs()
  }, [wallet?.id, fetchTxs])

  const refresh = useCallback(() => fetchTxs(true), [fetchTxs])

  return { transactions, loading, refresh }
}
