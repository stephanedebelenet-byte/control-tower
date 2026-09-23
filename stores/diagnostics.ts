import { create } from 'zustand'

export interface FaultCode {
  code: string
  description: string
  severity: 'warning' | 'critical'
  createdAt?: string
  resolvedAt?: string
}

export interface VehicleDiagnostics {
  vehicleId: string
  plateNumber: string
  status: string
  lastUpdate: string
  health: number
  telemetry: {
    speed: number
    rpm: number
    engineTemp: number
    coolantTemp: number
    oilPressure: number
    batteryHealth: number
    odometer: number
  } | null
  faultCodes: FaultCode[]
}

interface DiagnosticsStore {
  diagnostics: VehicleDiagnostics[]
  loading: boolean
  error: string | null

  setDiagnostics: (diagnostics: VehicleDiagnostics[]) => void
  updateVehicleDiagnostics: (
    vehicleId: string,
    data: Partial<VehicleDiagnostics>
  ) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getVehicleDiagnostics: (vehicleId: string) => VehicleDiagnostics | undefined
  getCriticalVehicles: () => VehicleDiagnostics[]
  getFleetHealthScore: () => number
  getActiveFaultCodes: () => FaultCode[]
}

export const useDiagnosticsStore = create<DiagnosticsStore>((set, get) => ({
  diagnostics: [],
  loading: false,
  error: null,

  setDiagnostics: (diagnostics) => set({ diagnostics }),
  updateVehicleDiagnostics: (vehicleId, data) =>
    set((state) => ({
      diagnostics: state.diagnostics.map((d) =>
        d.vehicleId === vehicleId ? { ...d, ...data } : d
      ),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getVehicleDiagnostics: (vehicleId) =>
    get().diagnostics.find((d) => d.vehicleId === vehicleId),

  getCriticalVehicles: () =>
    get().diagnostics.filter((d) => d.health < 70 || d.faultCodes.length > 0),

  getFleetHealthScore: () => {
    const diagnostics = get().diagnostics
    if (diagnostics.length === 0) return 100
    return (
      diagnostics.reduce((sum, d) => sum + d.health, 0) / diagnostics.length
    )
  },

  getActiveFaultCodes: () => {
    const diagnostics = get().diagnostics
    const allFaults: FaultCode[] = []
    diagnostics.forEach((d) => {
      allFaults.push(...d.faultCodes)
    })
    return allFaults
  },
}))
