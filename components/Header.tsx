'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  metrics?: {
    activeVehicles: number
    totalVehicles: number
    totalCapacity: number
    utilization: number
  }
}

export function Header({ metrics }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()

  const isActive = (path: string) =>
    pathname === path ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-300'

  return (
    <header className="bg-slate-950 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-500">🚛 Mojazine</h1>
          <p className="text-xs text-slate-500 mt-1">Fleet Management System</p>
        </div>

        <div className="flex items-center gap-8">
          {metrics && (
            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-slate-400">Active</div>
                <div className="text-lg font-bold text-green-400">
                  {metrics.activeVehicles}/{metrics.totalVehicles}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Capacity</div>
                <div className="text-lg font-bold text-blue-400">
                  {metrics.totalCapacity}T
                </div>
              </div>
              <div>
                <div className="text-slate-400">Utilization</div>
                <div className="text-lg font-bold text-yellow-400">
                  {metrics.utilization.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              <div>{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-6 text-sm border-t border-slate-700 pt-3">
        <Link href="/dashboard" className={`transition ${isActive('/dashboard')}`}>
          Dashboard
        </Link>
        <Link href="/deliveries" className={`transition ${isActive('/deliveries')}`}>
          Deliveries
        </Link>
        <Link href="/warehouses" className={`transition ${isActive('/warehouses')}`}>
          Warehouses
        </Link>
      </nav>
    </header>
  )
}
