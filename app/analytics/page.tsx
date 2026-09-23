'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useAnalyticsStore, type EcoScore, type HarshEvent } from '@/stores/analytics'
import axios from 'axios'

export default function AnalyticsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const {
    ecoScores,
    harshEvents,
    setEcoScores,
    setHarshEvents,
    setLoading,
    getAverageEcoScore,
    getCriticalEvents,
  } = useAnalyticsStore()

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchAnalytics()
  }, [token, router])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      const [scoresRes, eventsRes] = await Promise.all([
        axios.get('/api/eco-score?daysBack=30', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/harsh-events', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setEcoScores(scoresRes.data)
      setHarshEvents(eventsRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const avgEcoScore = getAverageEcoScore()
  const criticalEvents = getCriticalEvents()
  const unresolvedEvents = harshEvents.filter((e) => !e.resolved)

  // Group eco scores by vehicle
  const ecoByVehicle = ecoScores.reduce(
    (acc, score) => {
      if (!acc[score.vehicleId]) {
        acc[score.vehicleId] = []
      }
      acc[score.vehicleId].push(score)
      return acc
    },
    {} as Record<string, EcoScore[]>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Fleet Analytics
          </h1>
          <p className="text-slate-400">Eco-driving scores and vehicle performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
            <p className="text-cyan-300 text-sm mb-1">Fleet Eco-Score</p>
            <p className="text-3xl font-bold text-cyan-400">{avgEcoScore.toFixed(1)}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
            <p className="text-green-300 text-sm mb-1">Good Drivers</p>
            <p className="text-3xl font-bold text-green-400">
              {ecoScores.filter((s) => s.score >= 80).length}
            </p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4">
            <p className="text-yellow-300 text-sm mb-1">Needs Training</p>
            <p className="text-3xl font-bold text-yellow-400">
              {ecoScores.filter((s) => s.score < 70).length}
            </p>
          </div>
          <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
            <p className="text-red-300 text-sm mb-1">Critical Events</p>
            <p className="text-3xl font-bold text-red-400">{criticalEvents.length}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eco Scores by Vehicle */}
          <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
            <h2 className="text-lg font-semibold mb-4">Eco-Scores by Vehicle</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(ecoByVehicle).map(([vehicleId, scores]) => {
                const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length
                const latest = scores[0]
                return (
                  <div
                    key={vehicleId}
                    className="p-3 rounded-lg bg-slate-800 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-cyan-300">
                        {latest.vehicle?.plateNumber || 'Vehicle'}
                      </p>
                      <span
                        className={`text-sm font-bold ${
                          avgScore >= 80
                            ? 'text-green-400'
                            : avgScore >= 70
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {avgScore.toFixed(0)}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          avgScore >= 80
                            ? 'bg-green-500'
                            : avgScore >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${avgScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {scores.length} days tracked
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Harsh Events */}
          <div className="bg-slate-900/40 rounded-lg border border-red-500/20 p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Harsh Events</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unresolvedEvents.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No events recorded</p>
              ) : (
                unresolvedEvents.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${
                      event.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-medium text-sm text-white">
                          {event.type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {event.vehicle?.plateNumber || 'Vehicle'}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          event.severity === 'critical'
                            ? 'bg-red-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
