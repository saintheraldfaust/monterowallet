import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { ethers } from 'ethers'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { useBalances } from '../hooks/useBalances'
import { CHAINS, DEFAULT_TOKENS } from '../config/chains'
import { sendNative, sendToken, estimateNativeGas, estimateTokenGas, getNativeBalance, getProvider } from '../utils/wallet'
import TokenIcon from '../components/TokenIcon'

export default function Send() {
  const theme = useSettingsStore(s => s.theme)
  const wallet = useWalletStore(s => s.getActiveWallet())
  const customTokens = useWalletStore(s => s.customTokens)
  const { getBalance } = useBalances()
  const navigate = useNavigate()
  const location = useLocation()

  // Only show EVM-compatible tokens (exclude Tron until TronWeb is integrated)
  const allTokens = useMemo(
    () => [...DEFAULT_TOKENS, ...customTokens].filter(t => CHAINS[t.chain]?.evmCompatible !== false),
    [customTokens]
  )

  // Pre-select token from navigation state (e.g. from TokenDetail), fallback to first token
  const initialToken = useMemo(() => {
    const stateToken = location.state?.token
    if (stateToken) {
      const match = allTokens.find(t =>
        (t.contractAddress && stateToken.contractAddress &&
          t.contractAddress.toLowerCase() === stateToken.contractAddress.toLowerCase() &&
          t.chain === stateToken.chain) ||
        (t.symbol === stateToken.symbol && t.chain === stateToken.chain)
      )
      if (match) return match
    }
    return allTokens[0]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedToken, setSelectedToken] = useState(initialToken)
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState(1) // 1: form, 2: confirm, 3: result
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [showTokenPicker, setShowTokenPicker] = useState(false)
  const [tokenSearch, setTokenSearch] = useState('')
  const [gasEstimate, setGasEstimate] = useState(null)
  const [gasLoading, setGasLoading] = useState(false)
  const [nativeBalance, setNativeBalance] = useState(null)

  const filteredSendTokens = useMemo(() => {
    if (!tokenSearch.trim()) return allTokens
    const q = tokenSearch.toLowerCase()
    return allTokens.filter(t =>
      t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.chain.toLowerCase().includes(q)
    )
  }, [allTokens, tokenSearch])

  const balance = getBalance(selectedToken)
  const chain = CHAINS[selectedToken.chain]

  const handleReview = async () => {
    setError('')
    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Invalid recipient address')
      return
    }
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (num > parseFloat(balance)) {
      setError(`Insufficient ${selectedToken.symbol} balance`)
      return
    }
    // Move to confirm and estimate gas in background
    setStep(2)
    setGasEstimate(null)
    setGasLoading(true)
    setNativeBalance(null)
    try {
      const walletData = wallet.addresses[selectedToken.chain]
      // Fetch native balance (for gas) and gas estimate in parallel
      const nativeBal = getNativeBalance(chain.rpc, walletData.address)
      let gasEst
      if (selectedToken.isNative) {
        gasEst = estimateNativeGas(chain.rpc, walletData.address, recipient, amount)
      } else {
        gasEst = estimateTokenGas(chain.rpc, walletData.privateKey, selectedToken.contractAddress, recipient, amount, selectedToken.decimals)
      }
      const [nativeBalResult, gasResult] = await Promise.all([nativeBal, gasEst])
      setNativeBalance(nativeBalResult)
      setGasEstimate(gasResult)
    } catch (err) {
      // Non-blocking: show estimate unavailable
      setGasEstimate({ error: true })
    }
    setGasLoading(false)
  }

  const handleSend = async () => {
    if (!wallet || !chain) return
    setSending(true)
    setError('')
    try {
      const walletData = wallet.addresses[selectedToken.chain]
      let tx
      if (selectedToken.isNative) {
        tx = await sendNative(chain.rpc, walletData.privateKey, recipient, amount)
      } else {
        tx = await sendToken(chain.rpc, walletData.privateKey, selectedToken.contractAddress, recipient, amount, selectedToken.decimals)
      }
      setTxHash(tx.hash)
      setStep(3)
    } catch (err) {
      setError(err.message || 'Transaction failed')
    }
    setSending(false)
  }

  const setMax = () => setAmount(balance)

  const inputClass = `w-full py-3.5 px-4 rounded-2xl text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-primary'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary'
  }`

  const cardClass = `rounded-2xl p-5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`

  if (!wallet) return null

  return (
    <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className={`p-2 rounded-xl transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}>
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Send</h1>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Token picker */}
            <div className={cardClass}>
              <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>TOKEN</label>
              <button
                onClick={() => setShowTokenPicker(!showTokenPicker)}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border transition-colors ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <TokenIcon icon={selectedToken.icon} symbol={selectedToken.symbol} size={32} />
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{selectedToken.symbol}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{selectedToken.name}</p>
                </div>
                <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
              </button>

              {showTokenPicker && (
                <div className={`mt-2 max-h-64 rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  {/* Search input */}
                  <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="relative">
                      <HiOutlineMagnifyingGlass className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                      }`} />
                      <input
                        type="text"
                        value={tokenSearch}
                        onChange={e => setTokenSearch(e.target.value)}
                        placeholder="Search tokens..."
                        className={`w-full py-2 pl-8 pr-3 rounded-lg text-xs border transition-colors ${
                          theme === 'dark'
                            ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSendTokens.length === 0 ? (
                      <p className={`text-xs text-center py-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>No tokens found</p>
                    ) : (
                      filteredSendTokens.map(token => (
                        <button
                          key={`${token.chain}-${token.contractAddress || token.symbol}`}
                          onClick={() => { setSelectedToken(token); setShowTokenPicker(false); setTokenSearch('') }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
                          }`}
                        >
                          <TokenIcon icon={token.icon} symbol={token.symbol} size={28} />
                          <span className="text-sm font-medium">{token.symbol}</span>
                          <span className={`text-xs ml-auto ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{token.chain}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className={cardClass}>
              <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>RECIPIENT ADDRESS</label>
              <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x..." className={inputClass} />
            </div>

            {/* Amount */}
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>AMOUNT</label>
                <button onClick={setMax} className="text-xs font-semibold text-primary">
                  MAX: {parseFloat(balance).toFixed(4)} {selectedToken.symbol}
                </button>
              </div>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputClass} />
              {amount && parseFloat(amount) > 0 && selectedToken.priceUsd > 0 && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  ≈ ${(parseFloat(amount) * selectedToken.priceUsd).toFixed(2)} USD
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}

            <button onClick={handleReview} className="w-full py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25">
              Review Transfer
            </button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (() => {
          const gasFee = gasEstimate && !gasEstimate.error ? parseFloat(gasEstimate.feeFormatted) : null
          const nativeSym = chain?.symbol || 'ETH'
          const nativeBal = nativeBalance ? parseFloat(nativeBalance) : null
          // For native sends, total cost = amount + gas. For token sends, gas is in native.
          const totalNativeCost = selectedToken.isNative
            ? parseFloat(amount) + (gasFee || 0)
            : gasFee || 0
          const hasEnoughGas = nativeBal !== null && gasFee !== null ? nativeBal >= totalNativeCost : true
          const usdValue = parseFloat(amount) * (selectedToken.priceUsd || 0)

          return (
            <div className="space-y-4">
              {/* Transfer summary card */}
              <div className={cardClass}>
                <h2 className="font-bold text-lg mb-5">Confirm Transfer</h2>

                {/* Token & amount hero */}
                <div className="flex flex-col items-center mb-5">
                  <TokenIcon icon={selectedToken.icon} symbol={selectedToken.symbol} size={48} />
                  <p className="text-2xl font-extrabold mt-3">{amount} {selectedToken.symbol}</p>
                  {usdValue > 0 && (
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      ≈ ${usdValue.toFixed(2)} USD
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className={`border-t mb-4 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`} />

                {/* Details rows */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Network</span>
                    <div className="flex items-center gap-2">
                      {chain && <img src={chain.icon} alt={chain.name} className="w-4 h-4 rounded-full" />}
                      <span className="font-semibold text-sm">{chain?.name}</span>
                    </div>
                  </div>

                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Recipient</span>
                    <p className={`text-xs font-mono mt-1 break-all ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{recipient}</p>
                  </div>

                  {/* Divider */}
                  <div className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`} />

                  {/* Gas fee */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Estimated Gas Fee</span>
                    {gasLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Estimating...</span>
                      </div>
                    ) : gasEstimate?.error ? (
                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Unavailable</span>
                    ) : gasFee !== null ? (
                      <span className="font-semibold text-sm">
                        {gasFee < 0.000001 ? '<0.000001' : gasFee.toFixed(6)} {nativeSym}
                      </span>
                    ) : null}
                  </div>

                  {/* Gas limit */}
                  {gasEstimate && !gasEstimate.error && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Gas Limit</span>
                      <span className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{gasEstimate.gasLimit.toString()}</span>
                    </div>
                  )}

                  {/* Your native balance */}
                  {nativeBal !== null && (
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Your {nativeSym} Balance</span>
                      <span className={`font-semibold text-sm ${!hasEnoughGas ? 'text-red-500' : ''}`}>
                        {nativeBal < 0.000001 ? '<0.000001' : nativeBal.toFixed(6)} {nativeSym}
                      </span>
                    </div>
                  )}

                  {/* Total for native sends */}
                  {selectedToken.isNative && gasFee !== null && (
                    <>
                      <div className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`} />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Total Cost</span>
                        <span className="font-bold text-sm">
                          {totalNativeCost.toFixed(6)} {nativeSym}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Insufficient gas warning */}
              {!hasEnoughGas && (
                <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <p className="text-xs text-red-500 font-semibold">
                    ⚠️ Insufficient {nativeSym} for gas fees. You need at least {totalNativeCost.toFixed(6)} {nativeSym} but only have {nativeBal?.toFixed(6)} {nativeSym}.
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-500 font-medium px-1">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setGasEstimate(null) }} className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold border transition-colors ${
                  theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>Cancel</button>
                <button
                  onClick={handleSend}
                  disabled={sending || (!hasEnoughGas && gasFee !== null)}
                  className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Confirm Send'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className={`${cardClass} text-center`}>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-500 text-2xl">✓</span>
            </div>
            <h2 className="font-bold text-lg mb-2">Transaction Sent!</h2>
            <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Your {selectedToken.symbol} transfer has been submitted
            </p>
            {txHash && chain && (
              <a href={`${chain.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-primary text-sm font-medium hover:underline">
                View on Explorer ↗
              </a>
            )}
            <button onClick={() => { setStep(1); setAmount(''); setRecipient(''); setTxHash('') }}
              className="w-full mt-6 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors">
              New Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
