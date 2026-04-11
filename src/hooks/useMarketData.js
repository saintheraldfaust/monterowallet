import { useState, useEffect, useRef, useMemo } from 'react'
import { DEFAULT_TOKENS } from '../config/chains'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'

const CACHE_TTL = 60_000 // 1 minute
let cache = null
let cacheTime = 0
let cachedCurrency = null

/**
 * Fetches market data from CoinGecko for all tokens with a coingeckoId.
 * Returns a map: { [coingeckoId]: { current_price, price_change_percentage_24h, sparkline_in_7d, market_cap, ... } }
 */
export function useMarketData() {
  const [data, setData] = useState(cache)
  const [loading, setLoading] = useState(!cache)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const customTokens = useWalletStore(s => s.customTokens)
  const currency = useSettingsStore(s => s.currency)

  // Collect all unique CoinGecko IDs
  const coingeckoIds = useMemo(() => {
    const all = [...DEFAULT_TOKENS, ...customTokens]
    const ids = [...new Set(all.map(t => t.coingeckoId).filter(Boolean))]
    return ids
  }, [customTokens])

  async function fetchData() {
    const now = Date.now()
    const vsCurrency = currency.toLowerCase()
    if (cache && now - cacheTime < CACHE_TTL && cachedCurrency === vsCurrency) {
      setData(cache)
      setLoading(false)
      return
    }
    if (coingeckoIds.length === 0) {
      setLoading(false)
      return
    }
    try {
      const ids = coingeckoIds.join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets` +
        `?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc` +
        `&per_page=100&page=1&sparkline=true&price_change_percentage=24h`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      // Build a map by coingecko id
      const map = {}
      for (const coin of json) {
        map[coin.id] = coin
      }
      cache = map
      cacheTime = Date.now()
      cachedCurrency = vsCurrency
      setData(map)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, CACHE_TTL)
    return () => clearInterval(timerRef.current)
  }, [coingeckoIds.join(','), currency])

  /**
   * Get market data for a specific token by its coingeckoId
   */
  const getMarket = (coingeckoId) => {
    if (!data || !coingeckoId) return null
    return data[coingeckoId] || null
  }

  return { data, loading, error, getMarket, refetch: fetchData }
}
