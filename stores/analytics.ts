import { create } from 'zustand'

export interface EcoScore {
  id: string
  vehicleId: string
  date: string
  score: number
  speedConsistency: number
  accelerationSmootness: number
  brakingEfficiency: number
  fuelEfficiency: number
  rpmManagement: number
  vehicle?: { id: string; plateNumber: string }
}

export interface HarshEvent {
  id: string
  vehicleId: string
  type: 'harsh_braking' | 'harsh_acceleration' | 'speeding' | 'sharp_turn'
  severity: 'warning' | 'critical'
  message: string
  metadata?: any
  resolved: boolean
  createdAt: string
  vehicle?: { id: string; plateNumber: string }
}

interface AnalyticsStore {
  ecoScores: EcoScore[]
  harshEvents: HarshEvent[]
  loading: boolean
  error: string | null

  setEcoScores: (scores: EcoScore[]) => void
  addEcoScore: (score: EcoScore) => void

  setHarshEvents: (events: HarshEvent[]) => void
  addHarshEvent: (event: HarshEvent) => void
  resolveHarshEvent: (id: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getAverageEcoScore: (vehicleId?: string) => number
  getEcoScoresTrend: (daysBack?: number) => EcoScore[]
  getCriticalEvents: () => HarshEvent[]
  getEventsByVehicle: (vehicleId: string) => HarshEvent[]
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  ecoScores: [],
  harshEvents: [],
  loading: false,
  error: null,

  setEcoScores: (scores) => set({ ecoScores: scores }),
  addEcoScore: (score) =>
    set((state) => ({
      ecoScores: [score, ...state.ecoScores],
    })),

  setHarshEvents: (events) => set({ harshEvents: events }),
  addHarshEvent: (event) =>
    set((state) => ({
      harshEvents: [event, ...state.harshEvents],
    })),
  resolveHarshEvent: (id) =>
    set((state) => ({
      harshEvents: state.harshEvents.map((e) =>
        e.id === id ? { ...e, resolved: true } : e
      ),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getAverageEcoScore: (vehicleId) => {
    const scores = get().ecoScores
    const filtered = vehicleId
      ? scores.filter((s) => s.vehicleId === vehicleId)
      : scores

    if (filtered.length === 0) return 0
    return filtered.reduce((sum, s) => sum + s.score, 0) / filtered.length
  },

  getEcoScoresTrend: (daysBack = 7) => {
    const scores = get().ecoScores
    const now = new Date()
    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    return scores
      .filter((s) => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  },

  getCriticalEvents: () =>
    get().harshEvents.filter((e) => e.severity === 'critical' && !e.resolved),

  getEventsByVehicle: (vehicleId) =>
    get().harshEvents.filter((e) => e.vehicleId === vehicleId),
}))
