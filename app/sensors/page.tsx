'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useFuelStore } from '@/stores/fuel'
import axios from 'axios'

export default function SensorsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { fuelTanks, setFuelTanks, setLoading } = useFuelStore()

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchSensorData()
    const interval = setInterval(fetchSensorData, 60000) // Refresh every 60s

    return () => clearInterval(interval)
  }, [token, router])

  async function fetchSensorData() {
    try {
      setLoading(true)
      const response = await axios.get('/api/lorawan-devices', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFuelTanks(response.data)
    } catch (error) {
      console.error('Failed to fetch sensor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeSensors = fuelTanks.filter((t) => t.lastUpdate)
  const lowBatterySensors = fuelTanks.filter((t) => t.battery && t.battery < 20)
  const lowFuelTanks = fuelTanks.filter((t) => (t.currentLevel / t.capacity) * 100 < 20)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            LoRaWAN Sensor Monitoring
          </h1>
          <p className="text-slate-400">Remote fuel tank level tracking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
            <p className="text-cyan-300 text-sm mb-1">Active Sensors</p>
            <p className="text-3xl font-bold text-cyan-400">{activeSensors.length}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
            <p className="text-green-300 text-sm mb-1">Total Tanks</p>
            <p className="text-3xl font-bold text-green-400">{fuelTanks.length}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4">
            <p className="text-yellow-300 text-sm mb-1">Low Fuel</p>
            <p className="text-3xl font-bold text-yellow-400">{lowFuelTanks.length}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
            <p className="text-red-300 text-sm mb-1">Low Battery</p>
            <p className="text-3xl font-bold text-red-400">{lowBatterySensors.length}</p>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fuelTanks.map((tank) => {
            const utilization = (tank.currentLevel / tank.capacity) * 100
            const isLowFuel = utilization < 20
            const isLowBattery = tank.battery && tank.battery < 20

            return (
              <div
                key={tank.id}
                className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-300">
                      {tank.location}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {tank.deviceId || 'No device'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {tank.lastUpdate && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                        ● Active
                      </span>
                    )}
                    {isLowBattery && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs">
                        🔋 Low
                      </span>
                    )}
                  </div>
                </div>

                {/* Fuel Level */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-slate-500 text-sm">Fuel Level</p>
                    <p
                      className={`text-sm font-bold ${
                        isLowFuel ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      {tank.currentLevel.toLocaleString()} L
                    </p>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isLowFuel ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {utilization.toFixed(0)}% of {tank.capacity.toLocaleString()} L
                  </p>
                </div>

                {/* Sensor Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Battery</p>
                    <p className={`font-bold ${isLowBattery ? 'text-red-400' : 'text-white'}`}>
                      {tank.battery || '—'}%
                    </p>
                  </div>
                  <div className="bg-slate-800 rounded p-2">
                    <p className="text-slate-400">Signal</p>
                    <p className="font-bold text-white">{tank.signal || '—'} dBm</p>
                  </div>
                </div>

                {/* Last Update */}
                {tank.lastUpdate && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                    Updated: {new Date(tank.lastUpdate).toLocaleString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {fuelTanks.length === 0 && (
          <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-center text-slate-500">
            No fuel tanks configured
          </div>
        )}
      </div>
    </div>
  )
}
