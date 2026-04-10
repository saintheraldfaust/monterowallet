import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSettingsStore from '../stores/settingsStore'

export default function Welcome() {
  const theme = useSettingsStore(s => s.theme)
  const navigate = useNavigate()

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-6 ${
      theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'
    }`}>
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/25">
          <span className="text-white font-extrabold text-3xl">U</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          Urban<span className="text-primary">Wallet</span>
        </h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Your decentralized multi-chain wallet
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        <button
          onClick={() => navigate('/create')}
          className="w-full py-4 rounded-2xl bg-primary text-white font-semibold text-sm tracking-wide hover:bg-primary-dark active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          Create New Wallet
        </button>
        <button
          onClick={() => navigate('/import')}
          className={`w-full py-4 rounded-2xl font-semibold text-sm tracking-wide border-2 transition-all active:scale-[0.98] ${
            theme === 'dark'
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          Import Existing Wallet
        </button>
      </div>

      <p className={`text-xs mt-8 text-center max-w-xs ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
        By continuing, you agree to Urban Wallet's Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
