'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useFleetStore } from '@/stores/fleet'
import { Map } from '@/components/Map'
import io from 'socket.io-client'

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const { vehicles, setVehicles } = useFleetStore()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !user) {
      window.location.href = '/login'
      return
    }

    // Fetch fleet data
    fetchFleet()

    // Connect to Socket.IO
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      auth: { token },
    })

    socket.on('connect', () => {
      console.log('Socket connected')
      socket.emit('join-fleet', user.organizationId)
    })

    socket.on('gps-update', (data: any) => {
      console.log('GPS update:', data)
      // Update vehicle in store
      const updatedVehicles = vehicles.map((v) =>
        v.id === data.vehicleId
          ? {
              ...v,
              lastLocation: {
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed,
              },
            }
          : v
      )
      setVehicles(updatedVehicles)
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user, vehicles, setVehicles])

  async function fetchFleet() {
    try {
      setLoading(true)
      const res = await fetch('/api/fleet', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setVehicles(data.vehicles)
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Fetch fleet error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Loading fleet data...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Left Panel */}
      <div className="w-64 bg-gray-950 border-r border-gray-700 p-4 overflow-y-auto">
        <h1 className="text-2xl font-bold text-cyan-500 mb-6">Mojazine</h1>

        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-sm font-bold text-cyan-400 mb-3">Fleet Metrics</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Active Vehicles</span>
                <span className="text-green-400 font-bold">
                  {metrics?.activeVehicles}/{metrics?.totalVehicles}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Capacity</span>
                <span className="text-blue-400 font-bold">
                  {metrics?.totalCapacity}T
                </span>
              </div>
              <div className="flex justify-between">
                <span>Utilization</span>
                <span className="text-yellow-400 font-bold">
                  {metrics?.utilization?.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Distance</span>
                <span className="text-purple-400 font-bold">
                  {metrics?.totalDistance}km
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-cyan-400 mb-3">
              Vehicles ({vehicles.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedVehicle?.id === v.id
                      ? 'bg-cyan-500 text-gray-900'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="font-bold text-sm">{v.plateNumber}</div>
                  <div className="text-xs mt-1">
                    {v.lastLocation ? (
                      <>
                        <div>📍 {v.lastLocation.speed.toFixed(1)} km/h</div>
                        <div className="mt-1">
                          {v.status === 'active' ? (
                            <span className="text-green-400">● Active</span>
                          ) : v.status === 'offline' ? (
                            <span className="text-red-400">● Offline</span>
                          ) : (
                            <span className="text-blue-400">● {v.status}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-red-400">No GPS</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          vehicles={vehicles}
          onVehicleClick={(v) => setSelectedVehicle(v)}
        />
      </div>

      {/* Right Panel */}
      {selectedVehicle && (
        <div className="w-80 bg-gray-950 border-l border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-xl font-bold text-cyan-500 mb-4">
            {selectedVehicle.plateNumber}
          </h2>

          {selectedVehicle.lastLocation && (
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Location</div>
                <div className="text-sm font-mono text-cyan-400 mt-1">
                  {selectedVehicle.lastLocation.latitude.toFixed(4)}°N
                  <br />
                  {selectedVehicle.lastLocation.longitude.toFixed(4)}°W
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Speed</div>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {selectedVehicle.lastLocation.speed.toFixed(1)}
                  <span className="text-sm text-gray-400"> km/h</span>
                </div>
              </div>

              {selectedVehicle.telemetry && (
                <>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Engine</div>
                    <div className="text-sm space-y-1">
                      <div>
                        RPM: <span className="text-cyan-400">{selectedVehicle.telemetry.rpm?.toFixed(0)}</span>
                      </div>
                      <div>
                        Temp: <span className="text-yellow-400">{selectedVehicle.telemetry.engineTemp?.toFixed(1)}°C</span>
                      </div>
                      <div>
                        Fuel: <span className="text-blue-400">{selectedVehicle.telemetry.fuelLevel?.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
