import useSettingsStore from '../stores/settingsStore'

export default function TokenIcon({ icon, symbol, size = 40 }) {
  const theme = useSettingsStore(s => s.theme)

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
      }`}
      style={{ width: size, height: size }}
    >
      {icon ? (
        <img
          src={icon}
          alt={symbol}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}
      <div
        className="w-full h-full items-center justify-center text-xs font-bold text-primary bg-primary/10"
        style={{ display: icon ? 'none' : 'flex' }}
      >
        {symbol?.slice(0, 2).toUpperCase()}
      </div>
    </div>
  )
}
