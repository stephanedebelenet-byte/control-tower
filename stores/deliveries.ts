import { create } from 'zustand'

export interface DeliveryLine {
  id: string
  lineNumber: number
  productType: string
  quantity: number
  unit: string
}

export interface Delivery {
  id: string
  vehicleId: string
  driverId: string | null
  warehouseId: string | null
  targetLocation: string
  productType: string
  quantity: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  createdAt: string
  actualDeliveryTime: string | null
  lines: DeliveryLine[]
  vehicle?: { id: string; name: string; status: string }
  assignedDriver?: { id: string; name: string; phoneNumber: string }
}

interface DeliveriesStore {
  deliveries: Delivery[]
  loading: boolean
  error: string | null

  setDeliveries: (deliveries: Delivery[]) => void
  addDelivery: (delivery: Delivery) => void
  updateDelivery: (id: string, delivery: Partial<Delivery>) => void
  removeDelivery: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getDeliveryById: (id: string) => Delivery | undefined
  getDeliveriesByStatus: (status: string) => Delivery[]
  getDeliveriesByVehicle: (vehicleId: string) => Delivery[]
}

export const useDeliveriesStore = create<DeliveriesStore>((set, get) => ({
  deliveries: [],
  loading: false,
  error: null,

  setDeliveries: (deliveries) => set({ deliveries }),
  addDelivery: (delivery) =>
    set((state) => ({
      deliveries: [delivery, ...state.deliveries],
    })),
  updateDelivery: (id, delivery) =>
    set((state) => ({
      deliveries: state.deliveries.map((d) =>
        d.id === id ? { ...d, ...delivery } : d
      ),
    })),
  removeDelivery: (id) =>
    set((state) => ({
      deliveries: state.deliveries.filter((d) => d.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getDeliveryById: (id) => get().deliveries.find((d) => d.id === id),
  getDeliveriesByStatus: (status) =>
    get().deliveries.filter((d) => d.status === status),
  getDeliveriesByVehicle: (vehicleId) =>
    get().deliveries.filter((d) => d.vehicleId === vehicleId),
}))
