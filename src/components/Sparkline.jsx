export default function Sparkline({ prices = [], positive = true, width = 64, height = 28 }) {
  if (!prices || prices.length < 2) {
    return <div style={{ width: typeof width === 'number' ? width : '100%', height }} />
  }

  const isResponsive = width === '100%'
  const svgWidth = isResponsive ? 300 : width // internal viewBox width for responsive
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * svgWidth
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const color = positive ? '#22c55e' : '#ef4444'
  const pathD = `M ${pts.join(' L ')}`
  const areaD = `M 0,${height} L ${pts.join(' L ')} L ${svgWidth},${height} Z`
  const gradId = `spark-${positive ? 'g' : 'r'}-${svgWidth}`

  return (
    <svg
      width={isResponsive ? '100%' : width}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      preserveAspectRatio={isResponsive ? 'none' : 'none'}
      className="block"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
