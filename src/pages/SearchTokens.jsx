import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineMagnifyingGlass, HiOutlineXMark, HiOutlinePlus } from 'react-icons/hi2'
import { ethers } from 'ethers'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { CHAINS, DEFAULT_TOKENS, ERC20_ABI } from '../config/chains'
import TokenIcon from '../components/TokenIcon'

// Map CoinGecko platform names to our chain IDs
const PLATFORM_MAP = {
  'ethereum': 'ethereum',
  'binance-smart-chain': 'bsc',
}

// Popular tokens that users commonly want to add (BSC-pegged versions)
const POPULAR_TOKENS = [
  { coingeckoId: 'ripple', symbol: 'XRP', name: 'XRP', chain: 'bsc', contractAddress: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { coingeckoId: 'cardano', symbol: 'ADA', name: 'Cardano', chain: 'bsc', contractAddress: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/975/small/Cardano.png' },
  { coingeckoId: 'solana', symbol: 'SOL', name: 'Solana', chain: 'bsc', contractAddress: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { coingeckoId: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', chain: 'bsc', contractAddress: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8, icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { coingeckoId: 'polkadot', symbol: 'DOT', name: 'Polkadot', chain: 'bsc', contractAddress: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { coingeckoId: 'litecoin', symbol: 'LTC', name: 'Litecoin', chain: 'bsc', contractAddress: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { coingeckoId: 'chainlink', symbol: 'LINK', name: 'Chainlink', chain: 'bsc', contractAddress: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { coingeckoId: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', chain: 'bsc', contractAddress: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { coingeckoId: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', chain: 'bsc', contractAddress: '0x1CE0c2827e2eF14D5C4f29a091d735A204794041', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans_bg.png' },
  { coingeckoId: 'matic-network', symbol: 'MATIC', name: 'Polygon', chain: 'bsc', contractAddress: '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
  { coingeckoId: 'uniswap', symbol: 'UNI', name: 'Uniswap', chain: 'bsc', contractAddress: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg' },
  { coingeckoId: 'dai', symbol: 'DAI', name: 'Dai', chain: 'bsc', contractAddress: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
  { coingeckoId: 'the-graph', symbol: 'GRT', name: 'The Graph', chain: 'bsc', contractAddress: '0x52CE071Bd9b1C4B00A0b92D298c512478CaD67e8', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png' },
  { coingeckoId: 'fantom', symbol: 'FTM', name: 'Fantom', chain: 'bsc', contractAddress: '0xAD29AbB318791D579433D831ed122aFeAf29dcfe', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png' },
  { coingeckoId: 'filecoin', symbol: 'FIL', name: 'Filecoin', chain: 'bsc', contractAddress: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png' },
  { coingeckoId: 'cosmos', symbol: 'ATOM', name: 'Cosmos', chain: 'bsc', contractAddress: '0x0Eb3a705fc54725037CC9e008bDede697f62F335', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png' },
  { coingeckoId: 'pepe', symbol: 'PEPE', name: 'Pepe', chain: 'bsc', contractAddress: '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00', decimals: 18, icon: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg' },
]

export default function SearchTokens() {
  const theme = useSettingsStore(s => s.theme)
  const customTokens = useWalletStore(s => s.customTokens)
  const addCustomToken = useWalletStore(s => s.addCustomToken)
  const removeCustomToken = useWalletStore(s => s.removeCustomToken)
  const navigate = useNavigate()
  const searchTimerRef = useRef(null)

  const [query, setQuery] = useState('')
  const [cgResults, setCgResults] = useState([])
  const [cgLoading, setCgLoading] = useState(false)
  const [contractResult, setContractResult] = useState(null)
  const [contractSearching, setContractSearching] = useState(false)
  const [selectedChain, setSelectedChain] = useState('bsc')
  const [addingCoinId, setAddingCoinId] = useState(null)

  // Check if a token is already enabled (by contract+chain or coingeckoId)
  const isTokenEnabled = useCallback((token) => {
    if (!token) return false
    const all = [...DEFAULT_TOKENS, ...customTokens]
    return all.some(t => {
      if (token.contractAddress && t.contractAddress) {
        return t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase() && t.chain === token.chain
      }
      if (token.coingeckoId && t.coingeckoId) {
        return t.coingeckoId === token.coingeckoId
      }
      return false
    })
  }, [customTokens])

  // Check if a CoinGecko coin is enabled (by id or symbol)
  const isCoinEnabled = useCallback((coin) => {
    const id = typeof coin === 'string' ? coin : coin.coingeckoId
    const sym = typeof coin === 'string' ? '' : (coin.symbol || '').toLowerCase()
    const all = [...DEFAULT_TOKENS, ...customTokens]
    return all.some(t => t.coingeckoId === id || (sym && t.symbol.toLowerCase() === sym)) ||
      POPULAR_TOKENS.some(p => p.coingeckoId === id && isTokenEnabled(p))
  }, [customTokens, isTokenEnabled])

  // Toggle a known token (has contract info)
  const toggleKnownToken = (token) => {
    if (isTokenEnabled(token)) {
      const isDefault = DEFAULT_TOKENS.some(t =>
        t.contractAddress?.toLowerCase() === token.contractAddress?.toLowerCase() && t.chain === token.chain
      )
      if (!isDefault) removeCustomToken(token)
    } else {
      addCustomToken({ ...token, icon: token.icon || null, priceUsd: 0, isDefault: false })
    }
  }

  // Add a CoinGecko result: fetch platform contracts, then add
  const addCoinGeckoToken = async (coin) => {
    setAddingCoinId(coin.coingeckoId)
    try {
      // Check popular list first
      const known = POPULAR_TOKENS.find(p => p.coingeckoId === coin.coingeckoId)
      if (known) {
        addCustomToken({ ...known, icon: coin.icon || known.icon, priceUsd: 0, isDefault: false })
        setAddingCoinId(null)
        return
      }
      // Fetch coin detail for platform contracts
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.coingeckoId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const platforms = data.platforms || {}
      const detailPlatforms = data.detail_platforms || {}

      let added = false
      for (const pref of ['binance-smart-chain', 'ethereum']) {
        const chainId = PLATFORM_MAP[pref]
        const addr = platforms[pref]
        if (addr && addr.length > 0 && chainId) {
          addCustomToken({
            symbol: coin.symbol, name: coin.name,
            contractAddress: addr, chain: chainId,
            decimals: detailPlatforms[pref]?.decimal_place ?? 18,
            icon: coin.icon || data.image?.small || null,
            coingeckoId: coin.coingeckoId, priceUsd: 0, isDefault: false,
          })
          added = true
          break
        }
      }
      if (!added) {
        // No contract on our chains — add as display token
        addCustomToken({
          symbol: coin.symbol, name: coin.name,
          contractAddress: null, chain: 'bsc',
          decimals: 18, icon: coin.icon || data.image?.small || null,
          coingeckoId: coin.coingeckoId, priceUsd: 0, isDefault: false, displayOnly: true,
        })
      }
    } catch {
      // Fallback: add as display token
      addCustomToken({
        symbol: coin.symbol, name: coin.name,
        contractAddress: null, chain: 'bsc', decimals: 18,
        icon: coin.icon || null, coingeckoId: coin.coingeckoId,
        priceUsd: 0, isDefault: false, displayOnly: true,
      })
    }
    setAddingCoinId(null)
  }

  const removeCoinGeckoToken = (coin) => {
    const existing = customTokens.find(t => t.coingeckoId === coin.coingeckoId)
    if (existing) removeCustomToken(existing)
  }

  // Combined list: POPULAR_TOKENS that aren't already in defaults
  const availablePopular = useMemo(() => {
    return POPULAR_TOKENS.map(pt => ({
      ...pt,
      priceUsd: 0,
      isDefault: false,
    }))
  }, [])

  // Search CoinGecko for tokens
  const searchCoinGecko = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setCgResults([])
      return
    }
    setCgLoading(true)
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setCgResults((data.coins || []).slice(0, 20).map(c => ({
        coingeckoId: c.id,
        symbol: c.symbol?.toUpperCase(),
        name: c.name,
        icon: c.large || c.thumb,
        marketCapRank: c.market_cap_rank,
      })))
    } catch {
      setCgResults([])
    }
    setCgLoading(false)
  }, [])

  const handleQueryChange = (val) => {
    setQuery(val)
    setContractResult(null)
    clearTimeout(searchTimerRef.current)
    if (val.trim().startsWith('0x') && val.trim().length === 42) {
      // It's a contract address
      setCgResults([])
      return
    }
    searchTimerRef.current = setTimeout(() => searchCoinGecko(val), 400)
  }

  const isContractAddress = query.trim().startsWith('0x') && query.trim().length === 42

  const searchContract = async () => {
    if (!isContractAddress) return
    setContractSearching(true)
    setContractResult(null)
    try {
      const chain = CHAINS[selectedChain]
      const provider = new ethers.JsonRpcProvider(chain.rpc, undefined, { staticNetwork: true })
      const contract = new ethers.Contract(query.trim(), ERC20_ABI, provider)
      const [name, symbol, decimals] = await Promise.all([
        contract.name(), contract.symbol(), contract.decimals(),
      ])
      setContractResult({
        name, symbol, decimals: Number(decimals),
        contractAddress: query.trim(), chain: selectedChain,
        icon: null, priceUsd: 0, isDefault: false,
      })
    } catch {
      setContractResult({ error: 'Could not find a valid ERC20 token at this address' })
    }
    setContractSearching(false)
  }

  // Filter local popular tokens by query
  const filteredPopular = useMemo(() => {
    if (!query.trim() || isContractAddress) return availablePopular
    const q = query.toLowerCase()
    return availablePopular.filter(t =>
      t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    )
  }, [query, availablePopular, isContractAddress])

  const inputClass = `w-full py-3.5 pl-11 pr-10 rounded-2xl text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-primary'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary'
  }`

  const cardClass = `rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-white'}`

  return (
    <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      <div className="px-5 pt-6">
        {/* Search input */}
        <div className="relative mb-5">
          <HiOutlineMagnifyingGlass className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
          }`} />
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search tokens or paste contract address"
            className={inputClass}
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setCgResults([]); setContractResult(null) }}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
            >
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contract address mode */}
        {isContractAddress && (
          <div className={`rounded-2xl p-4 mb-5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
            <p className={`text-xs font-medium mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              CONTRACT ADDRESS DETECTED — SELECT CHAIN:
            </p>
            <div className="flex gap-2 mb-3">
              {Object.entries(CHAINS).filter(([k, c]) => c.evmCompatible).map(([key, chain]) => (
                <button
                  key={key}
                  onClick={() => setSelectedChain(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    selectedChain === key
                      ? 'bg-primary text-white'
                      : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {chain.name}
                </button>
              ))}
            </div>
            <button
              onClick={searchContract}
              disabled={contractSearching}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {contractSearching ? 'Searching...' : 'Search Token'}
            </button>

            {contractResult && !contractResult.error && (
              <div className={`mt-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <TokenIcon icon={contractResult.icon} symbol={contractResult.symbol} size={36} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{contractResult.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {contractResult.symbol} · {contractResult.decimals} decimals
                    </p>
                  </div>
                  <ToggleSwitch
                    enabled={isTokenEnabled(contractResult)}
                    onToggle={() => toggleKnownToken(contractResult)}
                    theme={theme}
                  />
                </div>
              </div>
            )}
            {contractResult?.error && (
              <p className="mt-3 text-sm text-red-500 font-medium">{contractResult.error}</p>
            )}
          </div>
        )}

        {/* CoinGecko search results */}
        {!isContractAddress && cgResults.length > 0 && (
          <div className="mb-5">
            <p className={`text-xs font-medium mb-2 px-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              SEARCH RESULTS
            </p>
            <div className={cardClass}>
              {cgResults.map(coin => {
                const enabled = isCoinEnabled(coin)
                const isAdding = addingCoinId === coin.coingeckoId
                return (
                  <div
                    key={coin.coingeckoId}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <TokenIcon icon={coin.icon} symbol={coin.symbol} size={40} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm truncate">{coin.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {coin.symbol}
                        {coin.marketCapRank && <span> · #{coin.marketCapRank}</span>}
                      </p>
                    </div>
                    {enabled ? (
                      <ToggleSwitch
                        enabled={true}
                        onToggle={() => removeCoinGeckoToken(coin)}
                        theme={theme}
                      />
                    ) : isAdding ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <button
                        onClick={() => addCoinGeckoToken(coin)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                      >
                        <HiOutlinePlus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {cgLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Popular tokens to add */}
        {!isContractAddress && !cgLoading && (
          <>
            <p className={`text-xs font-medium mb-2 px-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {query ? 'MATCHING TOKENS' : 'POPULAR TOKENS'}
            </p>
            <div className={cardClass}>
              {filteredPopular.length === 0 ? (
                <div className="py-12 text-center">
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No tokens found</p>
                </div>
              ) : (
                filteredPopular.map(token => (
                  <div
                    key={`${token.chain}-${token.contractAddress}`}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <TokenIcon icon={token.icon} symbol={token.symbol} size={40} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-sm">{token.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {token.symbol} · <span className="capitalize">{token.chain}</span>
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={isTokenEnabled(token)}
                      onToggle={() => toggleKnownToken(token)}
                      theme={theme}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Toggle switch component
function ToggleSwitch({ enabled, onToggle, theme }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        enabled ? 'bg-primary' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
        enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`} />
    </button>
  )
}


