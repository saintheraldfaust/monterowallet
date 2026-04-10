import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWalletStore from '../stores/walletStore'
import useSettingsStore from '../stores/settingsStore'
import { HiOutlineClipboardDocument, HiOutlineShieldCheck, HiOutlineArrowLeft } from 'react-icons/hi2'

export default function CreateWallet() {
  const theme = useSettingsStore(s => s.theme)
  const createWallet = useWalletStore(s => s.createWallet)
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: name, 2: show phrase, 3: confirm
  const [walletName, setWalletName] = useState('Main Wallet')
  const [walletData, setWalletData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmWords, setConfirmWords] = useState({})
  const [confirmError, setConfirmError] = useState('')

  const handleCreate = () => {
    const data = createWallet(walletName.trim() || 'Main Wallet')
    setWalletData(data)
    setStep(2)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletData.mnemonic)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const words = walletData?.mnemonic?.split(' ') || []
  const verifyIndices = [2, 5, 9] // Ask user to confirm word 3, 6, 10

  const handleConfirm = () => {
    const correct = verifyIndices.every(i => confirmWords[i]?.toLowerCase().trim() === words[i])
    if (correct) {
      navigate('/home')
    } else {
      setConfirmError('Incorrect words. Please check your recovery phrase.')
    }
  }

  const cardClass = `rounded-2xl p-6 ${
    theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
  }`

  return (
    <div className={`min-h-screen px-5 py-6 ${
      theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'
    }`}>
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className={`mb-6 p-2 rounded-xl transition-colors ${
          theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
        }`}>
          <HiOutlineArrowLeft className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
            }`} />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Create Wallet</h1>
            <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Give your wallet a name to get started
            </p>
            <div className={cardClass}>
              <label className={`text-xs font-medium mb-2 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                WALLET NAME
              </label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                placeholder="Main Wallet"
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium border transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary'
                }`}
              />
            </div>
            <button
              onClick={handleCreate}
              className="w-full mt-6 py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Show phrase */}
        {step === 2 && walletData && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <HiOutlineShieldCheck className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-bold">Recovery Phrase</h1>
            </div>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Write down these 12 words in order. This is the only way to recover your wallet.
            </p>

            <div className={`${cardClass} mb-4`}>
              <div className="grid grid-cols-3 gap-3">
                {words.map((word, i) => (
                  <div key={i} className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm ${
                    theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
                  }`}>
                    <span className={`text-xs font-mono w-5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>{i + 1}</span>
                    <span className="font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium mb-4 border transition-colors ${
                copied
                  ? 'border-green-500 text-green-500 bg-green-500/10'
                  : theme === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HiOutlineClipboardDocument className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <div className={`rounded-xl p-4 mb-6 ${
              theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
            }`}>
              <p className="text-xs text-amber-500 font-medium">
                ⚠️ Never share your recovery phrase. Anyone with these words can access your wallet.
              </p>
            </div>

            <button
              onClick={() => setStep(3)}
              className="w-full py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              I've Written It Down
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Verify Phrase</h1>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Confirm your recovery phrase by entering the requested words
            </p>

            <div className={`${cardClass} space-y-4`}>
              {verifyIndices.map(i => (
                <div key={i}>
                  <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    WORD #{i + 1}
                  </label>
                  <input
                    type="text"
                    value={confirmWords[i] || ''}
                    onChange={e => {
                      setConfirmWords({ ...confirmWords, [i]: e.target.value })
                      setConfirmError('')
                    }}
                    placeholder={`Enter word #${i + 1}`}
                    className={`w-full py-3 px-4 rounded-xl text-sm border transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary'
                    }`}
                  />
                </div>
              ))}
            </div>

            {confirmError && (
              <p className="text-sm text-red-500 mt-3 font-medium">{confirmError}</p>
            )}

            <button
              onClick={handleConfirm}
              className="w-full mt-6 py-4 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              Verify & Continue
            </button>

            <button
              onClick={() => navigate('/home')}
              className={`w-full mt-3 py-3 text-sm font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
            >
              Skip Verification
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
