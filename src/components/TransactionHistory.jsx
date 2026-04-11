import { HiOutlineArrowUpRight, HiOutlineArrowDownLeft, HiArrowLeft, HiOutlineArrowTopRightOnSquare, HiDocumentDuplicate } from 'react-icons/hi2'
import useSettingsStore from '../stores/settingsStore'
import { ethers } from 'ethers'
import { useState, useEffect, useCallback } from 'react'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

function timeAgo(ts) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullDate(ts) {
  return new Date(ts * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function shortAddr(addr) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function DetailRow({ label, children, theme, last = false }) {
  return (
    <div className={`flex flex-col gap-1 px-5 py-4 ${
      !last ? (theme === 'dark' ? 'border-b border-slate-700/50' : 'border-b border-slate-100') : ''
    }`}>
      <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default function TransactionHistory({ transactions, loading }) {
  const theme = useSettingsStore(s => s.theme)
  const [selectedTx, setSelectedTx] = useState(null)
  const { copied, copy: copyToClipboard } = useCopyToClipboard()

  const closeTx = useCallback(() => setSelectedTx(null), [])

  // Push history state when opening tx detail so back button closes it
  useEffect(() => {
    if (!selectedTx) return
    window.history.pushState({ txDetail: true }, '')
    const onPop = () => setSelectedTx(null)
    window.addEventListener('popstate', onPop)
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('popstate', onPop)
      document.body.style.overflow = ''
    }
  }, [selectedTx])

  // When closing via X button, also go back in history to stay in sync
  const handleClose = useCallback(() => {
    if (selectedTx) window.history.back()
  }, [selectedTx])

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No transactions yet</p>
      </div>
    )
  }

  return (
    <>
      <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-white'}`}>
        {transactions.map((tx, i) => {
          const decimalStr = tx.tokenDecimal ? tx.tokenDecimal.toString() : '18'
          const decimals = parseInt(decimalStr, 10)
          let amount = 0
          try {
            amount = parseFloat(ethers.formatUnits(tx.value || '0', decimals))
          } catch(e) {
            amount = 0
          }
          
          const isSend = tx.isSend
          const symbol = tx.tokenSymbol || (tx.chain === 'bsc' ? 'BNB' : 'ETH')
          const displayAmount = amount > 0.000001 ? amount.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '<0.000001'

          return (
            <div
              key={`${tx.hash}-${i}`}
              onClick={() => setSelectedTx({ ...tx, amount, symbol, isSend, displayAmount })}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 transition-colors cursor-pointer ${
                theme === 'dark' ? 'border-b border-slate-700/50 hover:bg-slate-800/50 last:border-0' : 'border-b border-slate-100 hover:bg-slate-50 last:border-0'
              }`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                tx.isError
                  ? 'bg-red-500/10'
                  : isSend
                    ? 'bg-orange-500/10'
                    : 'bg-green-500/10'
              }`}>
                {isSend ? (
                  <HiOutlineArrowUpRight className={`w-4 h-4 sm:w-5 sm:h-5 ${tx.isError ? 'text-red-500' : 'text-orange-500'}`} />
                ) : (
                  <HiOutlineArrowDownLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${tx.isError ? 'text-red-500' : 'text-green-500'}`} />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <p className="font-semibold text-xs sm:text-sm truncate">
                    {tx.isError ? 'Failed' : isSend ? 'Sent' : 'Received'}
                  </p>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tx.chainName || tx.chain.toUpperCase()}
                  </span>
                </div>
                <p className={`text-[10px] sm:text-xs truncate mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isSend ? `To: ${shortAddr(tx.to)}` : `From: ${shortAddr(tx.from)}`}
                </p>
              </div>

              {/* Amount + time */}
              <div className="text-right shrink-0 ml-2 max-w-[45%]">
                <p className={`text-xs sm:text-sm font-semibold tabular-nums truncate ${
                  tx.isError ? 'text-red-500' : isSend ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {isSend ? '-' : '+'}{displayAmount} {symbol}
                </p>
                <p className={`text-[9px] sm:text-[10px] mt-0.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {timeAgo(tx.timeStamp)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Transaction Detail — Full Screen Page */}
      {selectedTx && (
        <div className={`fixed inset-0 z-[100] flex flex-col ${
          theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'
        }`}>
          {/* Top bar — fixed */}
          <div className={`shrink-0 border-b ${
            theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3 px-4 py-4 max-w-lg mx-auto">
            <button
              onClick={handleClose}
              className={`p-2 -ml-1 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
            >
              <HiArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold">Transaction Details</h3>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
           <div className="max-w-lg mx-auto">
            {/* Hero section */}
            <div className="flex flex-col items-center justify-center px-6 pt-8 pb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                selectedTx.isError
                  ? 'bg-red-500/10 text-red-500'
                  : selectedTx.isSend
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-green-500/10 text-green-500'
              }`}>
                {selectedTx.isSend
                  ? <HiOutlineArrowUpRight className="w-10 h-10" />
                  : <HiOutlineArrowDownLeft className="w-10 h-10" />
                }
              </div>
              <p className={`text-sm font-medium mb-2 ${
                selectedTx.isError ? 'text-red-400' : selectedTx.isSend ? 'text-orange-400' : 'text-green-400'
              }`}>
                {selectedTx.isError ? 'Failed' : selectedTx.isSend ? 'Sent' : 'Received'}
              </p>
              <h2 className={`text-4xl font-extrabold tracking-tight text-center px-4 ${
                selectedTx.isError ? 'text-red-500' : selectedTx.isSend ? 'text-orange-500' : 'text-green-500'
              }`}>
                {selectedTx.isSend ? '-' : '+'}{selectedTx.displayAmount}
              </h2>
              <p className={`text-base mt-1 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedTx.symbol}
              </p>
            </div>

            {/* Details card */}
            <div className={`mx-4 rounded-2xl ${
              theme === 'dark' ? 'bg-slate-800/60' : 'bg-white'
            }`}>
              {/* Status */}
              <DetailRow label="Status" theme={theme}>
                <span className={`font-semibold ${selectedTx.isError ? 'text-red-500' : 'text-green-500'}`}>
                  {selectedTx.isError ? '✕ Failed' : '✓ Completed'}
                </span>
              </DetailRow>

              {/* Date */}
              <DetailRow label="Date" theme={theme}>
                <span className="font-medium">{fullDate(selectedTx.timeStamp)}</span>
              </DetailRow>

              {/* Network */}
              <DetailRow label="Network" theme={theme}>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg inline-block ${
                  theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedTx.chainName || selectedTx.chain?.toUpperCase()}
                </span>
              </DetailRow>

              {/* From */}
              <DetailRow label="From" theme={theme}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs break-all leading-relaxed flex-1">{selectedTx.from}</span>
                  <button
                    onClick={() => copyToClipboard(selectedTx.from, 'from')}
                    className="text-primary hover:opacity-70 shrink-0 mt-0.5"
                  >
                    <HiDocumentDuplicate className="w-4 h-4" />
                  </button>
                </div>
                {copied === 'from' && <span className="text-[10px] text-green-500 mt-1">Copied!</span>}
              </DetailRow>

              {/* To */}
              <DetailRow label="To" theme={theme}>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs break-all leading-relaxed flex-1">{selectedTx.to}</span>
                  <button
                    onClick={() => copyToClipboard(selectedTx.to, 'to')}
                    className="text-primary hover:opacity-70 shrink-0 mt-0.5"
                  >
                    <HiDocumentDuplicate className="w-4 h-4" />
                  </button>
                </div>
                {copied === 'to' && <span className="text-[10px] text-green-500 mt-1">Copied!</span>}
              </DetailRow>

              {/* Tx Hash */}
              <DetailRow label="Tx Hash" theme={theme} last>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-xs break-all leading-relaxed flex-1">{selectedTx.hash}</span>
                  <button
                    onClick={() => copyToClipboard(selectedTx.hash, 'hash')}
                    className="text-primary hover:opacity-70 shrink-0 mt-0.5"
                  >
                    <HiDocumentDuplicate className="w-4 h-4" />
                  </button>
                </div>
                {copied === 'hash' && <span className="text-[10px] text-green-500 mt-1">Copied!</span>}
              </DetailRow>
            </div>

            {/* Explorer button */}
            <div className="px-4 mt-6 pb-10">
              <a
                href={`${selectedTx.explorer}/tx/${selectedTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-white bg-primary hover:opacity-90 active:scale-[0.98]"
              >
                View on {selectedTx.chain === 'bsc' ? 'BscScan' : selectedTx.chain === 'ethereum' ? 'Etherscan' : 'Explorer'}
                <HiOutlineArrowTopRightOnSquare className="w-5 h-5" />
              </a>
            </div>
           </div>
          </div>
        </div>
      )}
    </>
  )
}
