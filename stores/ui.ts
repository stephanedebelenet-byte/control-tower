import { create } from 'zustand'

interface UIStore {
  selectedVehicleId: string | null
  showDetailPanel: boolean
  showAlertsPanel: boolean
  showChartsPanel: boolean
  selectedTab: 'vehicles' | 'alerts' | 'analytics'

  setSelectedVehicle: (id: string | null) => void
  toggleDetailPanel: () => void
  toggleAlertsPanel: () => void
  toggleChartsPanel: () => void
  setSelectedTab: (tab: 'vehicles' | 'alerts' | 'analytics') => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedVehicleId: null,
  showDetailPanel: false,
  showAlertsPanel: true,
  showChartsPanel: false,
  selectedTab: 'vehicles',

  setSelectedVehicle: (id) =>
    set((state) => ({
      selectedVehicleId: id,
      showDetailPanel: !!id,
    })),

  toggleDetailPanel: () =>
    set((state) => ({
      showDetailPanel: !state.showDetailPanel,
    })),

  toggleAlertsPanel: () =>
    set((state) => ({
      showAlertsPanel: !state.showAlertsPanel,
    })),

  toggleChartsPanel: () =>
    set((state) => ({
      showChartsPanel: !state.showChartsPanel,
    })),

  setSelectedTab: (tab) => set({ selectedTab: tab }),
}))
