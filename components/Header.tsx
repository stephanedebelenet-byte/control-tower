'use client'

import { useAuthStore } from '@/stores/auth'

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

  return (
    <header className="bg-gray-950 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-cyan-500">🚛 Mojazine</h1>
        <p className="text-xs text-gray-500 mt-1">Fleet Management System</p>
      </div>

      <div className="flex items-center gap-8">
        {metrics && (
          <div className="flex gap-6 text-sm">
            <div>
              <div className="text-gray-400">Active</div>
              <div className="text-lg font-bold text-green-400">
                {metrics.activeVehicles}/{metrics.totalVehicles}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Capacity</div>
              <div className="text-lg font-bold text-blue-400">{metrics.totalCapacity}T</div>
            </div>
            <div>
              <div className="text-gray-400">Utilization</div>
              <div className="text-lg font-bold text-yellow-400">
                {metrics.utilization.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <div>{user?.name}</div>
            <div className="text-xs text-gray-500">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded text-white transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
