import { useState, useMemo } from 'react'
import { HiOutlineArrowUpRight, HiOutlineQrCode, HiOutlineArrowDownLeft } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { useBalances } from '../hooks/useBalances'
import { useMarketData } from '../hooks/useMarketData'
import { useTransactions } from '../hooks/useTransactions'
import { DEFAULT_TOKENS, CHAINS } from '../config/chains'
import TokenRow from '../components/TokenRow'
import TransactionHistory from '../components/TransactionHistory'

const NETWORK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'bsc', label: 'BSC' },
  { id: 'ethereum', label: 'ETH' },
  { id: 'tron', label: 'TRX' },
]

export default function Home() {
  const theme = useSettingsStore(s => s.theme)
  const hideBalances = useSettingsStore(s => s.hideBalances)
  const currencySymbol = useSettingsStore(s => s.currencySymbol)
  const wallet = useWalletStore(s => s.getActiveWallet())
  const customTokens = useWalletStore(s => s.customTokens)
  const { getBalance, loading, refresh } = useBalances()
  const { getMarket } = useMarketData()
  const { transactions, loading: txLoading } = useTransactions(15)
  const navigate = useNavigate()

  const [networkFilter, setNetworkFilter] = useState('all')

  const allTokens = useMemo(() => [...DEFAULT_TOKENS, ...customTokens], [customTokens])

  const filteredTokens = useMemo(() => {
    if (networkFilter === 'all') return allTokens
    return allTokens.filter(t => t.chain === networkFilter)
  }, [allTokens, networkFilter])

  const totalUsd = useMemo(() => {
    return allTokens.reduce((sum, token) => {
      const bal = parseFloat(getBalance(token)) || 0
      const market = getMarket(token.coingeckoId)
      const price = market?.current_price ?? token.priceUsd ?? 0
      return sum + bal * price
    }, 0)
  }, [allTokens, getBalance, getMarket])

  if (!wallet) return null

  return (
    <div className="pb-24">
      {/* Balance Card */}
      <div className="px-5 pt-6 pb-4">
        <div className={`rounded-3xl p-6 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-primary via-blue-700 to-blue-900'
            : 'bg-gradient-to-br from-primary via-blue-500 to-blue-600'
        }`}>
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

          <p className="text-blue-200 text-xs font-medium tracking-wider mb-1">TOTAL BALANCE</p>
          <h2 className="text-white text-3xl font-extrabold mb-1 tracking-tight">
            {hideBalances ? '••••••' : `${currencySymbol}${totalUsd.toFixed(2)}`}
          </h2>
          <p className="text-blue-200/60 text-xs font-medium mb-6">
            {wallet.addresses?.ethereum?.address?.slice(0, 8)}...{wallet.addresses?.ethereum?.address?.slice(-6)}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/send')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/20 active:bg-white/25 transition-colors"
            >
              <HiOutlineArrowUpRight className="w-4 h-4" />
              Send
            </button>
            <button
              onClick={() => navigate('/receive')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/15 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/20 active:bg-white/25 transition-colors"
            >
              <HiOutlineArrowDownLeft className="w-4 h-4" />
              Receive
            </button>
            <button
              onClick={() => navigate('/receive')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/20 active:bg-white/25 transition-colors"
            >
              <HiOutlineQrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Token list */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Tokens</h3>
          <button
            onClick={refresh}
            className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
              loading ? 'text-primary animate-pulse' : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Network filter tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {NETWORK_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setNetworkFilter(f.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                networkFilter === f.id
                  ? 'bg-primary text-white'
                  : theme === 'dark'
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={`rounded-2xl overflow-hidden ${
          theme === 'dark' ? 'bg-slate-800/30' : 'bg-white'
        }`}>
          {filteredTokens.length === 0 ? (
            <div className="py-8 text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No tokens on this network</p>
            </div>
          ) : (
            filteredTokens.map((token) => (
              <TokenRow
                key={`${token.chain}-${token.contractAddress || token.symbol}`}
                token={token}
                balance={getBalance(token)}
                marketData={getMarket(token.coingeckoId)}
              />
            ))
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Recent Transactions</h3>
        </div>
        <TransactionHistory transactions={transactions} loading={txLoading} />
      </div>
    </div>
  )
}
