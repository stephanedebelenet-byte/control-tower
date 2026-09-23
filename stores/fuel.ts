import { create } from 'zustand'

export interface FuelTank {
  id: string
  organizationId: string
  location: string
  capacity: number
  currentLevel: number
  fuelType: string
  createdAt: string
}

export interface FuelFill {
  id: string
  vehicleId: string
  fuelTankId: string
  quantityLiters: number
  cost: number
  filledAt: string
  notes: string | null
  vehicle?: { id: string; plateNumber: string }
  fuelTank?: { id: string; location: string }
}

interface FuelStore {
  fuelTanks: FuelTank[]
  fuelFills: FuelFill[]
  loading: boolean
  error: string | null

  setFuelTanks: (tanks: FuelTank[]) => void
  addFuelTank: (tank: FuelTank) => void
  updateFuelTank: (id: string, tank: Partial<FuelTank>) => void

  setFuelFills: (fills: FuelFill[]) => void
  addFuelFill: (fill: FuelFill) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getTankById: (id: string) => FuelTank | undefined
  getTankUtilization: (tankId: string) => number
  getLowFuelTanks: (threshold: number) => FuelTank[]
}

export const useFuelStore = create<FuelStore>((set, get) => ({
  fuelTanks: [],
  fuelFills: [],
  loading: false,
  error: null,

  setFuelTanks: (tanks) => set({ fuelTanks: tanks }),
  addFuelTank: (tank) =>
    set((state) => ({
      fuelTanks: [tank, ...state.fuelTanks],
    })),
  updateFuelTank: (id, tank) =>
    set((state) => ({
      fuelTanks: state.fuelTanks.map((t) =>
        t.id === id ? { ...t, ...tank } : t
      ),
    })),

  setFuelFills: (fills) => set({ fuelFills: fills }),
  addFuelFill: (fill) =>
    set((state) => ({
      fuelFills: [fill, ...state.fuelFills],
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getTankById: (id) => get().fuelTanks.find((t) => t.id === id),
  getTankUtilization: (tankId) => {
    const tank = get().fuelTanks.find((t) => t.id === tankId)
    if (!tank) return 0
    return (tank.currentLevel / tank.capacity) * 100
  },
  getLowFuelTanks: (threshold = 30) =>
    get().fuelTanks.filter((t) => (t.currentLevel / t.capacity) * 100 <= threshold),
}))
