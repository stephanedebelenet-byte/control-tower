'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useFuelStore, type FuelTank } from '@/stores/fuel'
import axios from 'axios'

export default function FuelManagementPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { fuelTanks, setFuelTanks, setLoading } = useFuelStore()
  const [selectedTank, setSelectedTank] = useState<FuelTank | null>(null)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchFuelTanks()
  }, [token, router])

  async function fetchFuelTanks() {
    try {
      setLoading(true)
      const response = await axios.get('/api/fuel', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFuelTanks(response.data)
    } catch (error) {
      console.error('Failed to fetch fuel tanks:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCapacity = fuelTanks.reduce((sum, t) => sum + t.capacity, 0)
  const totalFuel = fuelTanks.reduce((sum, t) => sum + t.currentLevel, 0)
  const utilization =
    totalCapacity > 0 ? ((totalFuel / totalCapacity) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Fuel Management
          </h1>
          <p className="text-slate-400">Monitor fuel tanks and refueling operations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
            <p className="text-slate-500 text-sm mb-1">Total Capacity</p>
            <p className="text-2xl font-bold text-cyan-300">
              {totalCapacity.toLocaleString()} L
            </p>
          </div>
          <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
            <p className="text-slate-500 text-sm mb-1">Current Level</p>
            <p className="text-2xl font-bold text-green-400">
              {totalFuel.toLocaleString()} L
            </p>
          </div>
          <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
            <p className="text-slate-500 text-sm mb-1">Utilization</p>
            <p className="text-2xl font-bold text-yellow-400">{utilization}%</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fuel Tanks List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">
                {fuelTanks.length} Tanks
              </h2>
              <div className="space-y-2">
                {fuelTanks.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No fuel tanks</p>
                ) : (
                  fuelTanks.map((tank) => (
                    <button
                      key={tank.id}
                      onClick={() => setSelectedTank(tank)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedTank?.id === tank.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-sm">{tank.location}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {tank.currentLevel.toLocaleString()} /{' '}
                        {tank.capacity.toLocaleString()} L
                      </p>
                      <div className="w-full bg-slate-600 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-cyan-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(tank.currentLevel / tank.capacity) * 100}%`,
                          }}
                        />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tank Details */}
          <div className="lg:col-span-2">
            {selectedTank ? (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                  {selectedTank.location}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-slate-500 text-sm">Fuel Type</p>
                    <p className="text-white font-medium text-sm">
                      {selectedTank.fuelType}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">Capacity</p>
                    <p className="text-white font-medium text-sm">
                      {selectedTank.capacity.toLocaleString()} L
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-slate-500 text-sm mb-2">Current Level</p>
                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        (selectedTank.currentLevel / selectedTank.capacity) * 100 < 30
                          ? 'bg-red-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(selectedTank.currentLevel / selectedTank.capacity) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-white font-bold mt-2">
                    {selectedTank.currentLevel.toLocaleString()} /{' '}
                    {selectedTank.capacity.toLocaleString()} L (
                    {(
                      (selectedTank.currentLevel / selectedTank.capacity) *
                      100
                    ).toFixed(1)}
                    %)
                  </p>
                </div>

                <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition">
                  Record Fuel Fill
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-slate-500 text-center">
                <p>Select a fuel tank to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
