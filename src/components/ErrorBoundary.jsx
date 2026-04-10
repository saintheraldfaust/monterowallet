import { Component } from 'react'
import useSettingsStore from '../stores/settingsStore'

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      const { theme } = this.props
      return (
        <div className={`min-h-screen flex items-center justify-center px-6 ${
          theme === 'dark' ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.href = '/home'
              }}
              className="px-6 py-3 rounded-2xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function ErrorBoundary({ children }) {
  const theme = useSettingsStore(s => s.theme)
  return <ErrorBoundaryInner theme={theme}>{children}</ErrorBoundaryInner>
}
