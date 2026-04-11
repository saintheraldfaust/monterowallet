import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineArrowUpRight, HiOutlineClipboardDocument } from 'react-icons/hi2'
import useSettingsStore from '../stores/settingsStore'
import { useBalances } from '../hooks/useBalances'
import { useMarketData } from '../hooks/useMarketData'
import { CHAINS } from '../config/chains'
import TokenIcon from '../components/TokenIcon'
import Sparkline from '../components/Sparkline'
import TransactionHistory from '../components/TransactionHistory'
import { useTransactions } from '../hooks/useTransactions'
import { useCopy } from '../hooks/useCopy'

export default function TokenDetail() {
  const { chainId, contractAddress } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useSettingsStore(s => s.theme)
  const hideBalances = useSettingsStore(s => s.hideBalances)
  const currencySymbol = useSettingsStore(s => s.currencySymbol)
  const { getBalance } = useBalances()
  const { getMarket } = useMarketData()
  const { copied, copy } = useCopy()
  const { transactions, loading: txLoading, refresh: txRefresh } = useTransactions(50)

  const token = location.state?.token

  // Filter transactions that belong to this specific token
  const tokenTxs = useMemo(() => {
    if (!token || !transactions.length) return []
    return transactions.filter(tx => {
      // Must be on the same chain
      if (tx.chain !== token.chain) return false
      // Native token: match non-ERC20 txs on this chain
      if (token.isNative) return !tx.isErc20
      // ERC20 token: match by contract address
      if (token.contractAddress && tx.contractAddress) {
        return tx.contractAddress === token.contractAddress.toLowerCase()
      }
      // Fallback: match by token symbol
      return tx.tokenSymbol?.toUpperCase() === token.symbol?.toUpperCase()
    })
  }, [transactions, token])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Token not found</p>
      </div>
    )
  }

  const market = getMarket(token.coingeckoId)
  const balance = parseFloat(getBalance(token)) || 0
  const livePrice = market?.current_price ?? token.priceUsd ?? 0
  const usdValue = balance * livePrice
  const change24h = market?.price_change_percentage_24h ?? 0
  const positive = change24h >= 0
  const sparkline = market?.sparkline_in_7d?.price ?? []
  const chain = CHAINS[token.chain]

  const fmtNum = (n) => {
    if (!n && n !== 0) return 'N/A'
    if (n >= 1e12) return `${currencySymbol}${(n / 1e12).toFixed(2)}T`
    if (n >= 1e9) return `${currencySymbol}${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `${currencySymbol}${(n / 1e6).toFixed(2)}M`
    if (n >= 1000) return `${currencySymbol}${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    if (n >= 1) return `${currencySymbol}${n.toFixed(2)}`
    if (n >= 0.01) return `${currencySymbol}${n.toFixed(4)}`
    return `${currencySymbol}${n.toFixed(8)}`
  }

  const cardClass = `rounded-2xl p-5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`
  const labelClass = `text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`
  const dividerClass = `border-b ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`

  return (
    <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-xl transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}>
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <TokenIcon icon={token.icon} symbol={token.symbol} size={32} />
          <div>
            <h1 className="text-lg font-bold">{token.name}</h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{token.symbol} · <span className="capitalize">{token.chain}</span></p>
          </div>
        </div>

        {/* Balance card */}
        <div className={`rounded-2xl p-6 mb-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
          <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>BALANCE</p>
          <h2 className="text-3xl font-extrabold mb-1">
            {hideBalances ? '••••••' : balance > 1000000
              ? `${(balance / 1000000).toFixed(2)}M`
              : balance.toFixed(balance < 1 ? 6 : 2)
            }
            <span className={`text-lg ml-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{token.symbol}</span>
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {hideBalances ? '••••' : `≈ ${currencySymbol}${usdValue.toFixed(2)}`}
          </p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/send', { state: { token } })}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              <HiOutlineArrowUpRight className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={() => navigate('/receive')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-colors ${
                theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Receive
            </button>
          </div>
        </div>

        {/* Price chart */}
        {sparkline.length > 2 && (
          <div className={cardClass + ' mb-4 overflow-hidden'}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>PRICE</p>
                <p className="text-xl font-bold">{fmtNum(livePrice)}</p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {positive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
              </div>
            </div>
            <div className="w-full">
              <Sparkline prices={sparkline} positive={positive} width="100%" height={80} />
            </div>
            <p className={`text-[10px] mt-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`}>7-day price chart</p>
          </div>
        )}

        {/* Market Info */}
        {market && (
          <div className={cardClass + ' mb-4'}>
            <h3 className="font-bold text-sm mb-4">Market Info</h3>
            <div className="space-y-3">
              {[
                { label: 'Market Cap', value: fmtNum(market.market_cap) },
                { label: 'Market Cap Rank', value: market.market_cap_rank ? `#${market.market_cap_rank}` : 'N/A' },
                { label: '24h Volume', value: fmtNum(market.total_volume) },
                { label: '24h High', value: fmtNum(market.high_24h) },
                { label: '24h Low', value: fmtNum(market.low_24h) },
                { label: 'Circulating Supply', value: market.circulating_supply ? `${(market.circulating_supply / 1e6).toFixed(2)}M ${token.symbol}` : 'N/A' },
                { label: 'All-Time High', value: fmtNum(market.ath) },
              ].map(row => (
                <div key={row.label} className={`flex items-center justify-between py-2 ${dividerClass}`}>
                  <span className={labelClass}>{row.label}</span>
                  <span className="text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Token details */}
        <div className={cardClass}>
          <h3 className="font-bold text-sm mb-4">Token Details</h3>
          <div className="space-y-3">
            {[
              { label: 'Network', value: chain?.name || token.chain },
              { label: 'Symbol', value: token.symbol },
              { label: 'Decimals', value: token.decimals },
              ...(token.contractAddress ? [{ label: 'Contract', value: token.contractAddress, copyable: true }] : []),
            ].map(row => (
              <div key={row.label} className={`flex items-center justify-between py-2 ${dividerClass}`}>
                <span className={labelClass}>{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium max-w-[200px] truncate">{row.value}</span>
                  {row.copyable && (
                    <button onClick={() => copy(String(row.value))} className="text-primary">
                      <HiOutlineClipboardDocument className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History for this token */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Transaction History</h3>
            <button
              onClick={txRefresh}
              className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                txLoading ? 'text-primary animate-pulse' : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {txLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <TransactionHistory transactions={tokenTxs} loading={txLoading} />
        </div>
      </div>
    </div>
  )
}
