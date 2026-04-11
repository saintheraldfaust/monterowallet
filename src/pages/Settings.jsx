import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HiOutlineSun, HiOutlineMoon, HiOutlineChevronRight, HiOutlineShieldCheck,
  HiOutlineCurrencyDollar, HiOutlineWallet, HiOutlineEye, HiOutlineEyeSlash,
  HiOutlinePaintBrush, HiOutlineArrowRightOnRectangle, HiOutlineDocumentText,
  HiOutlineKey, HiOutlineTrash, HiOutlinePencil, HiOutlineArrowLeft,
  HiOutlinePlusCircle, HiOutlineClipboardDocument
} from 'react-icons/hi2'
import useSettingsStore from '../stores/settingsStore'
import useWalletStore from '../stores/walletStore'
import { CURRENCIES } from '../config/chains'
import { useCopy } from '../hooks/useCopy'

function SettingRow({ icon: Icon, label, value, onClick, danger, theme }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors ${
        theme === 'dark' ? 'hover:bg-slate-800/50 active:bg-slate-800' : 'hover:bg-slate-50 active:bg-slate-100'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
        danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`flex-1 text-left text-sm font-medium ${danger ? 'text-red-500' : ''}`}>{label}</span>
      {value && <span className={`text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{value}</span>}
      <HiOutlineChevronRight className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
    </button>
  )
}

export default function Settings() {
  const theme = useSettingsStore(s => s.theme)
  const toggleTheme = useSettingsStore(s => s.toggleTheme)
  const currency = useSettingsStore(s => s.currency)
  const setCurrency = useSettingsStore(s => s.setCurrency)
  const hideBalances = useSettingsStore(s => s.hideBalances)
  const toggleHideBalances = useSettingsStore(s => s.toggleHideBalances)

  const wallet = useWalletStore(s => s.getActiveWallet())
  const wallets = useWalletStore(s => s.wallets)
  const getMnemonic = useWalletStore(s => s.getMnemonic)
  const renameWallet = useWalletStore(s => s.renameWallet)
  const deleteWallet = useWalletStore(s => s.deleteWallet)
  const signOut = useWalletStore(s => s.signOut)
  const navigate = useNavigate()
  const { copied, copy } = useCopy()

  const [view, setView] = useState('main') // 'main' | 'currency' | 'wallets' | 'export' | 'rename'
  const [editName, setEditName] = useState('')
  const [showPhrase, setShowPhrase] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const cardClass = `rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-white'}`

  // Main settings
  if (view === 'main') {
    return (
      <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className="px-5 pt-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {/* Wallet info */}
          {wallet && (
            <div className={`rounded-2xl p-5 mb-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{wallet.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold">{wallet.name}</p>
                  <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {wallet.addresses?.ethereum?.address?.slice(0, 10)}...{wallet.addresses?.ethereum?.address?.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          <p className={`text-xs font-semibold mb-2 px-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>APPEARANCE</p>
          <div className={`${cardClass} mb-4`}>
            <SettingRow
              icon={theme === 'dark' ? HiOutlineMoon : HiOutlineSun}
              label="Theme"
              value={theme === 'dark' ? 'Dark' : 'Light'}
              onClick={toggleTheme}
              theme={theme}
            />
            <SettingRow
              icon={hideBalances ? HiOutlineEyeSlash : HiOutlineEye}
              label="Hide Balances"
              value={hideBalances ? 'On' : 'Off'}
              onClick={toggleHideBalances}
              theme={theme}
            />
            <SettingRow
              icon={HiOutlineCurrencyDollar}
              label="Currency"
              value={currency}
              onClick={() => setView('currency')}
              theme={theme}
            />
          </div>

          {/* Wallet management */}
          <p className={`text-xs font-semibold mb-2 px-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>WALLET</p>
          <div className={`${cardClass} mb-4`}>
            <SettingRow icon={HiOutlineWallet} label="Manage Wallets" value={`${wallets.length} wallets`} onClick={() => setView('wallets')} theme={theme} />
            <SettingRow icon={HiOutlinePencil} label="Rename Wallet" onClick={() => { setEditName(wallet?.name || ''); setView('rename') }} theme={theme} />
            <SettingRow icon={HiOutlineShieldCheck} label="Export Wallet" onClick={() => { setShowPhrase(false); setShowPrivateKey(false); setView('export') }} theme={theme} />
          </div>

          {/* Danger zone */}
          <p className={`text-xs font-semibold mb-2 px-1 text-red-500/60`}>DANGER ZONE</p>
          <div className={cardClass}>
            {wallets.length > 1 && (
              <SettingRow
                icon={HiOutlineTrash}
                label="Delete Current Wallet"
                onClick={() => { if (confirm('Are you sure? This cannot be undone.')) deleteWallet(wallet.id) }}
                danger
                theme={theme}
              />
            )}
            <SettingRow
              icon={HiOutlineArrowRightOnRectangle}
              label="Remove Wallet From Device"
              onClick={() => {
                if (confirm('This will remove all wallets from this device. Make sure you have backed up your recovery phrase. Your crypto is safe on the blockchain — you can restore anytime with your phrase.\n\nContinue?')) {
                  signOut()
                  navigate('/welcome')
                }
              }}
              danger
              theme={theme}
            />
          </div>
        </div>
      </div>
    )
  }

  // Currency picker
  if (view === 'currency') {
    return (
      <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('main')} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Currency</h1>
          </div>
          <div className={cardClass}>
            {CURRENCIES.map(c => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c.code, c.symbol); setView('main') }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors ${
                  c.code === currency ? 'bg-primary/10' : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-lg w-8 text-center">{c.symbol}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${c.code === currency ? 'text-primary' : ''}`}>{c.name}</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{c.code}</p>
                </div>
                {c.code === currency && <div className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Manage wallets
  if (view === 'wallets') {
    return (
      <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className="px-5 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('main')} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Manage Wallets</h1>
          </div>
          <div className={cardClass}>
            {wallets.map(w => (
              <button
                key={w.id}
                onClick={() => { useWalletStore.getState().setActiveWallet(w.id); setView('main') }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors ${
                  w.id === wallet?.id ? 'bg-primary/10' : theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  w.id === wallet?.id ? 'bg-primary text-white' : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                }`}>
                  {w.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${w.id === wallet?.id ? 'text-primary' : ''}`}>{w.name}</p>
                  <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {w.addresses?.ethereum?.address?.slice(0, 8)}...{w.addresses?.ethereum?.address?.slice(-4)}
                  </p>
                </div>
                {w.id === wallet?.id && <div className="w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => navigate('/create')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors">
              <HiOutlinePlusCircle className="w-4 h-4" /> Create New
            </button>
            <button onClick={() => navigate('/import')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold border transition-colors ${
                theme === 'dark' ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> Import
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Rename wallet
  if (view === 'rename') {
    return (
      <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className="px-5 pt-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('main')} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Rename Wallet</h1>
          </div>
          <div className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className={`w-full py-3.5 px-4 rounded-xl text-sm border transition-colors ${
                theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'
              }`}
              placeholder="Wallet name"
            />
            <button
              onClick={() => { renameWallet(wallet.id, editName.trim() || wallet.name); setView('main') }}
              className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Export wallet
  if (view === 'export') {
    const mnemonic = wallet ? getMnemonic(wallet.id) : null
    const privateKey = wallet?.addresses?.ethereum?.privateKey || ''

    return (
      <div className={`min-h-screen pb-24 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <div className="px-5 pt-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('main')} className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Export Wallet</h1>
          </div>

          <div className={`rounded-xl p-4 mb-6 ${theme === 'dark' ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
            <p className="text-xs text-red-500 font-medium">
              ⚠️ Never share your recovery phrase or private key. Anyone with access can steal your funds.
            </p>
          </div>

          {/* Recovery phrase */}
          {mnemonic && (
            <div className={`rounded-2xl p-5 mb-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4 text-primary" />
                  Recovery Phrase
                </h3>
                <button onClick={() => setShowPhrase(!showPhrase)} className="text-xs text-primary font-semibold">
                  {showPhrase ? 'Hide' : 'Show'}
                </button>
              </div>
              {showPhrase && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {mnemonic.split(' ').map((word, i) => (
                      <div key={i} className={`py-2 px-2.5 rounded-lg text-xs ${
                        theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
                      }`}>
                        <span className={`font-mono mr-1 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{i + 1}</span>
                        <span className="font-medium">{word}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => copy(mnemonic)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors">
                    <HiOutlineClipboardDocument className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy Phrase'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Private key */}
          <div className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <HiOutlineKey className="w-4 h-4 text-primary" />
                Private Key (EVM)
              </h3>
              <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-xs text-primary font-semibold">
                {showPrivateKey ? 'Hide' : 'Show'}
              </button>
            </div>
            {showPrivateKey && (
              <>
                <p className={`text-xs font-mono break-all leading-relaxed mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {privateKey}
                </p>
                <button onClick={() => copy(privateKey)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors">
                  <HiOutlineClipboardDocument className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Key'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
