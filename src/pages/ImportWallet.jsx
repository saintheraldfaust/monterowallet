import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { HiOutlineArrowLeft, HiOutlineKey, HiOutlineDocumentText } from 'react-icons/hi2'
import { validateMnemonic } from '../utils/wallet'

export default function ImportWallet() {
  const theme = useSettingsStore(s => s.theme)
  const importFromMnemonic = useWalletStore(s => s.importWalletFromMnemonic)
  const importFromKey = useWalletStore(s => s.importWalletFromPrivateKey)
  const navigate = useNavigate()

  const [tab, setTab] = useState('phrase') // 'phrase' | 'key'
  const [phrase, setPhrase] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [walletName, setWalletName] = useState('Imported Wallet')
  const [error, setError] = useState('')

  const handleImportPhrase = () => {
    const cleaned = phrase.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!validateMnemonic(cleaned)) {
      setError('Invalid recovery phrase. Must be 12 valid words.')
      return
    }
    const result = importFromMnemonic(cleaned, walletName.trim() || 'Imported Wallet')
    if (result) navigate('/home')
    else setError('Failed to import wallet')
  }

  const handleImportKey = () => {
    const key = privateKey.trim()
    if (!key || key.length < 64) {
      setError('Invalid private key')
      return
    }
    const result = importFromKey(key.startsWith('0x') ? key : `0x${key}`, walletName.trim() || 'Imported Wallet')
    if (result) navigate('/home')
    else setError('Failed to import wallet from private key')
  }

  const inputClass = `w-full py-3 px-4 rounded-xl text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary'
  }`

  return (
    <div className={`min-h-screen px-5 py-6 ${
      theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'
    }`}>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/')} className={`mb-6 p-2 rounded-xl transition-colors ${
          theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
        }`}>
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-2xl font-bold mb-2">Import Wallet</h1>
        <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Import using your recovery phrase or private key
        </p>

        {/* Tabs */}
        <div className={`flex rounded-xl p-1 mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <button
            onClick={() => { setTab('phrase'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'phrase' ? 'bg-primary text-white shadow-md' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <HiOutlineDocumentText className="w-4 h-4" />
            Phrase
          </button>
          <button
            onClick={() => { setTab('key'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'key' ? 'bg-primary text-white shadow-md' : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <HiOutlineKey className="w-4 h-4" />
            Private Key
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            WALLET NAME
          </label>
          <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="Imported Wallet" className={inputClass} />
        </div>

        {/* Phrase input */}
        {tab === 'phrase' && (
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              RECOVERY PHRASE
            </label>
            <textarea
              value={phrase}
              onChange={e => { setPhrase(e.target.value); setError('') }}
              rows={4}
              placeholder="Enter your 12-word recovery phrase separated by spaces"
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        {/* Key input */}
        {tab === 'key' && (
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              PRIVATE KEY
            </label>
            <textarea
              value={privateKey}
              onChange={e => { setPrivateKey(e.target.value); setError('') }}
              rows={3}
              placeholder="Enter your private key (with or without 0x prefix)"
              className={`${inputClass} resize-none font-mono`}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-4 font-medium">{error}</p>}

        <button
          onClick={tab === 'phrase' ? handleImportPhrase : handleImportKey}
          className="w-full py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          Import Wallet
        </button>
      </div>
    </div>
  )
}
