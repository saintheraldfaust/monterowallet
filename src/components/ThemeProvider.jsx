import useSettingsStore from '../stores/settingsStore'

export default function ThemeProvider({ children }) {
  const theme = useSettingsStore(s => s.theme)

  return (
    <div className={`min-h-screen transition-all duration-200 ${
      theme === 'dark'
        ? 'bg-[#0f172a] text-slate-100'
        : 'bg-slate-100 text-slate-900'
    }`}>
      {children}
    </div>
  )
}
