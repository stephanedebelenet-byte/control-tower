import { create } from 'zustand'

export interface Alert {
  id: string
  vehicleId?: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  createdAt: Date
  resolved: boolean
}

interface AlertsStore {
  alerts: Alert[]
  addAlert: (alert: Alert) => void
  removeAlert: (id: string) => void
  resolveAlert: (id: string) => void
  clearAlerts: () => void
  getUnresolvedAlerts: () => Alert[]
}

export const useAlertsStore = create<AlertsStore>((set, get) => ({
  alerts: [],

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100
    }))
  },

  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }))
  },

  resolveAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    }))
  },

  clearAlerts: () => set({ alerts: [] }),

  getUnresolvedAlerts: () =>
    get()
      .alerts.filter((a) => !a.resolved)
      .slice(0, 20),
}))
