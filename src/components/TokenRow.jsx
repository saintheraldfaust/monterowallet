import { useNavigate } from 'react-router-dom'
import useSettingsStore from '../stores/settingsStore'
import TokenIcon from './TokenIcon'
import Sparkline from './Sparkline'

export default function TokenRow({ token, balance, marketData, onPress }) {
  const theme = useSettingsStore(s => s.theme)
  const hideBalances = useSettingsStore(s => s.hideBalances)
  const currencySymbol = useSettingsStore(s => s.currencySymbol)
  const navigate = useNavigate()

  const numBalance = parseFloat(balance) || 0
  const livePrice = marketData?.current_price ?? token.priceUsd ?? 0
  const change24h = marketData?.price_change_percentage_24h ?? 0
  const sparkline = marketData?.sparkline_in_7d?.price ?? []
  const positive = change24h >= 0
  const usdValue = numBalance * livePrice

  const displayBalance = numBalance > 0 ? (numBalance > 1000000
    ? `${(numBalance / 1000000).toFixed(2)}M`
    : numBalance > 1000
      ? `${(numBalance / 1000).toFixed(2)}K`
      : numBalance.toFixed(numBalance < 1 ? 6 : 2)
  ) : '0'

  const fmtPrice = (p) => {
    if (!p) return '$0.00'
    if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    if (p >= 1) return `$${p.toFixed(2)}`
    if (p >= 0.01) return `$${p.toFixed(4)}`
    if (p >= 0.001) return `$${p.toFixed(5)}`
    // tiny price with subscript zeros
    const s = p.toFixed(20).split('.')[1]
    let z = 0
    for (const c of s) { if (c === '0') z++; else break }
    const sig = s.slice(z, z + 4).replace(/0+$/, '')
    return `$0.0...${sig}`
  }

  return (
    <button
      onClick={() => navigate(`/token/${token.chain}/${token.contractAddress || 'native'}`, { state: { token, balance } })}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${
        theme === 'dark' ? 'hover:bg-slate-800/50 active:bg-slate-800' : 'hover:bg-slate-50 active:bg-slate-100'
      }`}
    >
      <TokenIcon icon={token.icon} symbol={token.symbol} size={42} />

      {/* Name + price */}
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm truncate">{token.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            {fmtPrice(livePrice)}
          </span>
          {change24h !== 0 && (
            <span className={`text-[10px] font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>
              {positive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {/* Sparkline - always on sm+, on mobile only if balance is zero */}
      {sparkline.length > 2 && (
        <div className={`shrink-0 ${numBalance > 0 ? 'hidden sm:block' : 'block'}`}>
          <Sparkline prices={sparkline.slice(-24)} positive={positive} width={56} height={24} />
        </div>
      )}

      {/* Balance + USD value */}
      <div className="text-right shrink-0 min-w-[70px]">
        <p className="font-semibold text-sm tabular-nums">
          {hideBalances ? '••••' : displayBalance}
        </p>
        <p className={`text-xs tabular-nums mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          {hideBalances ? '••••' : usdValue > 0 ? `${currencySymbol}${usdValue.toFixed(2)}` : `${currencySymbol}0.00`}
        </p>
      </div>
    </button>
  )
}
