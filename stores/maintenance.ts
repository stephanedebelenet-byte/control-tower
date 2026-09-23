import { create } from 'zustand'

export interface SparePart {
  id: string
  maintenanceTaskId: string
  partName: string
  quantity: number
  unitPrice: number
  notes: string | null
}

export interface MaintenanceTask {
  id: string
  vehicleId: string
  taskType: string
  description: string | null
  scheduledDate: string
  completedDate: string | null
  estimatedCost: number
  actualCost: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  spareParts?: SparePart[]
  vehicle?: { id: string; plateNumber: string }
}

interface MaintenanceStore {
  tasks: MaintenanceTask[]
  loading: boolean
  error: string | null

  setTasks: (tasks: MaintenanceTask[]) => void
  addTask: (task: MaintenanceTask) => void
  updateTask: (id: string, task: Partial<MaintenanceTask>) => void
  removeTask: (id: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getTaskById: (id: string) => MaintenanceTask | undefined
  getTasksByVehicle: (vehicleId: string) => MaintenanceTask[]
  getTasksByStatus: (status: string) => MaintenanceTask[]
  getUpcomingTasks: (days?: number) => MaintenanceTask[]
  getOverdueTasks: () => MaintenanceTask[]
  getTotalMaintenanceCost: () => number
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),
  updateTask: (id, task) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...task } : t
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),
  getTasksByVehicle: (vehicleId) =>
    get().tasks.filter((t) => t.vehicleId === vehicleId),
  getTasksByStatus: (status) =>
    get().tasks.filter((t) => t.status === status),
  getUpcomingTasks: (days = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return get().tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        new Date(t.scheduledDate) >= now &&
        new Date(t.scheduledDate) <= future
    )
  },
  getOverdueTasks: () => {
    const now = new Date()
    return get().tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        new Date(t.scheduledDate) < now
    )
  },
  getTotalMaintenanceCost: () =>
    get().tasks.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost), 0),
}))
