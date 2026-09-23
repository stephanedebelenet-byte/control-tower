import { create } from 'zustand'
import { useQuery } from '@tanstack/react-query'

interface Vehicle {
  id: string
  plateNumber: string
  status: string
  currentWeight: number
  capacity: number
  currentLocation: string
  speed: number
}

interface FleetStore {
  vehicles: Vehicle[]
  totalActive: number
  totalCapacity: number
  setVehicles: (vehicles: Vehicle[]) => void
  updateVehicleLocation: (id: string, location: string, speed: number) => void
}

export const useFleetStore = create<FleetStore>((set) => ({
  vehicles: [],
  totalActive: 0,
  totalCapacity: 0,

  setVehicles: (vehicles) => {
    set({
      vehicles,
      totalActive: vehicles.filter((v) => v.status === 'active').length,
      totalCapacity: vehicles.reduce((sum, v) => sum + v.capacity, 0),
    })
  },

  updateVehicleLocation: (id, location, speed) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, currentLocation: location, speed } : v
      ),
    }))
  },
}))

export function useFleetQuery(orgId: string) {
  return useQuery({
    queryKey: ['fleet', orgId],
    queryFn: () =>
      fetch(`/api/fleet/${orgId}`).then((res) => res.json()),
    enabled: !!orgId,
  })
}
