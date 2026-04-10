import { useState, useMemo } from 'react'
import { HiOutlineArrowLeft, HiOutlineClipboardDocument, HiOutlineChevronDown, HiOutlineInformationCircle } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { QRCode } from 'react-qr-code'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { CHAINS } from '../config/chains'
import { useCopy } from '../hooks/useCopy'

export default function Receive() {
  const theme = useSettingsStore(s => s.theme)
  const wallet = useWalletStore(s => s.getActiveWallet())
  const navigate = useNavigate()
  const { copied, copy } = useCopy()
  const [showChainPicker, setShowChainPicker] = useState(false)

  // Show all chains where the wallet has a valid address (including Tron)
  const availableChains = useMemo(() => {
    if (!wallet) return []
    return Object.entries(CHAINS).filter(([key]) => {
      const addr = wallet.addresses[key]?.address
      return addr && addr.length > 0
    })
  }, [wallet])

  const [selectedChain, setSelectedChain] = useState(() => {
    // Default to BSC if available, else first available chain
    if (wallet?.addresses?.bsc?.address) return 'bsc'
    return availableChains[0]?.[0] || 'bsc'
  })

  if (!wallet) return null

  const chain = CHAINS[selectedChain]
  const address = wallet.addresses[selectedChain]?.address || ''

  return (
    <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="px-5 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-xl transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}>
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Receive</h1>
        </div>

        <div className={`rounded-2xl p-6 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
          {/* Chain selector — centered */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                onClick={() => setShowChainPicker(!showChainPicker)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {chain && <img src={chain.icon} alt={chain.name} className="w-5 h-5 rounded-full" />}
                {chain?.name || 'Select Network'}
                <HiOutlineChevronDown className="w-3.5 h-3.5" />
              </button>

              {showChainPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowChainPicker(false)} />
                  <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                    theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    {availableChains.map(([key, c]) => (
                      <button
                        key={key}
                        onClick={() => { setSelectedChain(key); setShowChainPicker(false) }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          key === selectedChain ? 'bg-primary/10 text-primary' : theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <img src={c.icon} alt={c.name} className="w-5 h-5 rounded-full" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* QR Code — centered */}
          <div className="flex justify-center mb-5">
            <div className="bg-white p-5 rounded-2xl">
              {address ? (
                <QRCode value={address} size={180} />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-slate-400 text-sm">
                  No address available
                </div>
              )}
            </div>
          </div>

          {/* Address — centered */}
          <p className={`text-xs font-mono break-all mb-4 px-4 leading-relaxed text-center ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {address}
          </p>

          {/* Copy button — centered */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => copy(address)}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${
                copied
                  ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/25'
              }`}
            >
              <HiOutlineClipboardDocument className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
          </div>

          {/* Warning — centered */}
          <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <p className="text-xs text-amber-500 font-medium text-center">
              ⚠️ Only send {chain?.name} compatible tokens to this address
            </p>
          </div>

          {/* Info about same address */}
          <div className={`mt-3 p-4 rounded-xl flex items-start gap-2.5 ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <HiOutlineInformationCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
              This address can receive <strong>all tokens</strong> on the {chain?.name} network. You don't need a different address for each token.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
