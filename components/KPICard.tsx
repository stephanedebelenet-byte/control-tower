interface KPICardProps {
  label: string
  value: string | number
  unit?: string
  icon?: string
  trend?: number // percentage change
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue'
}

export function KPICard({
  label,
  value,
  unit,
  icon,
  trend,
  color = 'cyan',
}: KPICardProps) {
  const colors = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20',
    green: 'text-green-400 bg-green-400/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-400/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[color]} bg-gray-800`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className={`text-xs mt-2 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  )
}
