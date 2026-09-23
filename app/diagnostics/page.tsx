'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useDiagnosticsStore, type VehicleDiagnostics } from '@/stores/diagnostics'
import axios from 'axios'

export default function DiagnosticsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const {
    diagnostics,
    setDiagnostics,
    setLoading,
    getCriticalVehicles,
    getFleetHealthScore,
  } = useDiagnosticsStore()

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDiagnostics | null>(
    null
  )

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchDiagnostics()
    const interval = setInterval(fetchDiagnostics, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [token, router])

  async function fetchDiagnostics() {
    try {
      setLoading(true)
      const response = await axios.get('/api/diagnostics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDiagnostics(response.data)
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const criticalVehicles = getCriticalVehicles()
  const fleetHealth = getFleetHealthScore()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Vehicle Diagnostics (CAN Bus)
          </h1>
          <p className="text-slate-400">Real-time telemetry and fault code monitoring</p>
        </div>

        {/* Fleet Health Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
            <p className="text-cyan-300 text-sm mb-1">Fleet Health</p>
            <p className="text-3xl font-bold text-cyan-400">{fleetHealth.toFixed(0)}%</p>
          </div>
          <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
            <p className="text-red-300 text-sm mb-1">Critical Vehicles</p>
            <p className="text-3xl font-bold text-red-400">{criticalVehicles.length}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
            <p className="text-green-300 text-sm mb-1">Healthy Fleet</p>
            <p className="text-3xl font-bold text-green-400">
              {diagnostics.length - criticalVehicles.length}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">{diagnostics.length} Vehicles</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {diagnostics.map((vehicle) => (
                  <button
                    key={vehicle.vehicleId}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedVehicle?.vehicleId === vehicle.vehicleId
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          vehicle.health >= 80
                            ? 'bg-green-500'
                            : vehicle.health >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {vehicle.plateNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          Health: {vehicle.health}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="lg:col-span-2">
            {selectedVehicle ? (
              <div className="space-y-4">
                {/* Telemetry */}
                <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                    Real-time Telemetry
                  </h3>

                  {selectedVehicle.telemetry ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Speed</p>
                        <p className="text-2xl font-bold text-white">
                          {selectedVehicle.telemetry.speed}
                          <span className="text-xs text-slate-400 ml-1">km/h</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">RPM</p>
                        <p className="text-2xl font-bold text-white">
                          {(selectedVehicle.telemetry.rpm / 1000).toFixed(1)}
                          <span className="text-xs text-slate-400 ml-1">k</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Engine Temp</p>
                        <p
                          className={`text-2xl font-bold ${
                            selectedVehicle.telemetry.engineTemp > 110
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                        >
                          {selectedVehicle.telemetry.engineTemp}°C
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Oil Pressure</p>
                        <p
                          className={`text-2xl font-bold ${
                            selectedVehicle.telemetry.oilPressure < 20
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                        >
                          {selectedVehicle.telemetry.oilPressure}
                          <span className="text-xs text-slate-400 ml-1">psi</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Battery</p>
                        <p
                          className={`text-2xl font-bold ${
                            selectedVehicle.telemetry.batteryHealth < 50
                              ? 'text-red-400'
                              : 'text-white'
                          }`}
                        >
                          {selectedVehicle.telemetry.batteryHealth}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Odometer</p>
                        <p className="text-2xl font-bold text-white">
                          {(selectedVehicle.telemetry.odometer / 1000).toFixed(1)}
                          <span className="text-xs text-slate-400 ml-1">k km</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">No telemetry data available</p>
                  )}
                </div>

                {/* Fault Codes */}
                <div className="bg-slate-900/40 rounded-lg border border-red-500/20 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-red-300">
                      Active Fault Codes ({selectedVehicle.faultCodes.length})
                    </h3>
                  </div>

                  {selectedVehicle.faultCodes.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No faults detected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedVehicle.faultCodes.map((fault, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            fault.severity === 'critical'
                              ? 'bg-red-500/10 border-red-500/30'
                              : 'bg-yellow-500/10 border-yellow-500/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-bold text-sm">
                                {fault.code}
                              </p>
                              <p className="text-sm text-slate-300 mt-1">
                                {fault.description}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                fault.severity === 'critical'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-yellow-500 text-white'
                              }`}
                            >
                              {fault.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-slate-500 text-center">
                Select a vehicle to view diagnostics
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
