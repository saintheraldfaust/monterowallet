import { NavLink } from 'react-router-dom'
import { HiOutlineHome, HiOutlinePaperAirplane, HiOutlineCog6Tooth, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import useSettingsStore from '../stores/settingsStore'

const tabs = [
  { to: '/home', icon: HiOutlineHome, label: 'Home' },
  { to: '/search', icon: HiOutlineMagnifyingGlass, label: 'Search' },
  { to: '/send', icon: HiOutlinePaperAirplane, label: 'Send' },
  { to: '/settings', icon: HiOutlineCog6Tooth, label: 'Settings' },
]

export default function BottomNav() {
  const theme = useSettingsStore(s => s.theme)

  return (
    <nav className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg md:bottom-6 md:rounded-2xl z-50 safe-bottom border-t md:border backdrop-blur-xl transition-all shadow-none md:shadow-2xl ${
      theme === 'dark'
        ? 'bg-[#0f172a]/95 border-slate-800'
        : 'bg-white/95 border-slate-200'
    }`}>
      <div className="flex justify-around items-center h-[72px] md:h-16 px-2 md:px-6">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium tracking-wide">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
