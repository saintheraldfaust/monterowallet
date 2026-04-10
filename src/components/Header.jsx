import { useNavigate } from 'react-router-dom'
import { HiOutlineChevronDown, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { useState } from 'react'

export default function Header() {
  const wallet = useWalletStore(s => s.getActiveWallet())
  const wallets = useWalletStore(s => s.wallets)
  const setActiveWallet = useWalletStore(s => s.setActiveWallet)
  const theme = useSettingsStore(s => s.theme)
  const hideBalances = useSettingsStore(s => s.hideBalances)
  const toggleHideBalances = useSettingsStore(s => s.toggleHideBalances)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="md:px-4 md:pt-6 sticky top-0 md:top-0 z-40 relative">
      <header className={`backdrop-blur-xl border-b md:border md:rounded-2xl transition-all shadow-none md:shadow-xl ${
        theme === 'dark'
          ? 'bg-[#0f172a]/90 border-slate-800'
          : 'bg-white/90 border-slate-200'
      }`}>
        <div className="w-full flex items-center justify-between px-5 h-16 md:h-14">
          {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/home')}
        >
          <img src="/urban.png" alt="Urban Wallet" className="w-auto h-8 rounded-lg object-fit" />
          <span className="font-bold text-base tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
           Montero<span className="text-primary"></span>
          </span>
        </div>

        {/* Wallet selector + eye */}
        <div className="flex items-center gap-3">
          <button onClick={toggleHideBalances} className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}>
            {hideBalances
              ? <HiOutlineEyeSlash className="w-5 h-5" />
              : <HiOutlineEye className="w-5 h-5" />
            }
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="max-w-[100px] truncate">{wallet?.name || 'Wallet'}</span>
              <HiOutlineChevronDown className="w-3.5 h-3.5" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}>
                  {wallets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => { setActiveWallet(w.id); setShowDropdown(false) }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                        w.id === wallet?.id
                          ? 'bg-primary/10 text-primary'
                          : theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        w.id === wallet?.id ? 'bg-primary text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {w.addresses?.ethereum?.address?.slice(0, 6)}...{w.addresses?.ethereum?.address?.slice(-4)}
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className={`border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                    <button
                      onClick={() => { navigate('/settings/wallets'); setShowDropdown(false) }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium text-primary transition-colors ${
                        theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                      }`}
                    >
                      + Manage Wallets
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </header>
    </div>
  )
}
