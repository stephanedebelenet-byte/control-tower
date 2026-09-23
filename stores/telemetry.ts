import { create } from 'zustand'

interface Telemetry {
  vehicleId: string
  speed: number
  rpm: number
  engineTemp: number
  fuelLevel: number
  fuelRate: number
  accelerationX: number
  accelerationY: number
  accelerationZ: number
  brakePressure: number
  odometer: number
  timestamp: Date
}

interface TelemetryStore {
  telemetry: Map<string, Telemetry>
  updateTelemetry: (vehicleId: string, data: Partial<Telemetry>) => void
  getTelemetry: (vehicleId: string) => Telemetry | undefined
  clearOldTelemetry: () => void
}

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  telemetry: new Map(),

  updateTelemetry: (vehicleId, data) => {
    set((state) => {
      const existing = state.telemetry.get(vehicleId)
      const updated = {
        vehicleId,
        ...existing,
        ...data,
        timestamp: new Date(),
      }
      const newMap = new Map(state.telemetry)
      newMap.set(vehicleId, updated)
      return { telemetry: newMap }
    })
  },

  getTelemetry: (vehicleId) => get().telemetry.get(vehicleId),

  clearOldTelemetry: () => {
    set((state) => {
      const now = Date.now()
      const cutoff = now - 5 * 60 * 1000 // 5 minutes
      const newMap = new Map(state.telemetry)

      newMap.forEach((value, key) => {
        if (value.timestamp.getTime() < cutoff) {
          newMap.delete(key)
        }
      })

      return { telemetry: newMap }
    })
  },
}))
