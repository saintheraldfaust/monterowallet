import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useSettingsStore from './stores/settingsStore'
import useWalletStore from './stores/walletStore'
import ThemeProvider from './components/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Welcome from './pages/Welcome'
import Landing from './pages/Landing'
import CreateWallet from './pages/CreateWallet'
import ImportWallet from './pages/ImportWallet'
import Home from './pages/Home'
import Send from './pages/Send'
import Receive from './pages/Receive'
import SearchTokens from './pages/SearchTokens'
import TokenDetail from './pages/TokenDetail'
import Settings from './pages/Settings'

function AppShell({ children }) {
  return (
    <div className="max-w-lg mx-auto min-h-screen relative">
      <Header />
      <main>{children}</main>
      <BottomNav />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const initialized = useWalletStore(s => s.initialized)
  if (!initialized) return <Navigate to="/" replace />
  return (
    <AppShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  )
}

export default function App() {
  const initTheme = useSettingsStore(s => s.initTheme)
  const initialized = useWalletStore(s => s.initialized)

  useEffect(() => {
    initTheme()
  }, [])

  return (
    <ThemeProvider>
      <Routes>
        {/* Landing Page Website */}
        <Route path="/" element={<Landing />} />

        {/* Onboarding */}
        <Route path="/welcome" element={initialized ? <Navigate to="/home" replace /> : <Welcome />} />
        <Route path="/create" element={<CreateWallet />} />
        <Route path="/import" element={<ImportWallet />} />

        {/* Protected app routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/send" element={<ProtectedRoute><Send /></ProtectedRoute>} />
        <Route path="/receive" element={<ProtectedRoute><Receive /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchTokens /></ProtectedRoute>} />
        <Route path="/token/:chainId/:contractAddress" element={<ProtectedRoute><TokenDetail /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/wallets" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
