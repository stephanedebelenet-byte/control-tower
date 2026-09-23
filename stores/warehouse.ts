import { create } from 'zustand'

export interface InventoryItem {
  id: string
  warehouseId: string
  productType: string
  quantity: number
  unit: string
  reorderLevel: number
  notes: string | null
  createdAt: string
}

export interface Warehouse {
  id: string
  name: string
  type: 'depot' | 'storage' | 'distribution'
  latitude: number
  longitude: number
  capacity: number | null
  notes: string | null
  inventory?: InventoryItem[]
}

interface WarehouseStore {
  warehouses: Warehouse[]
  inventory: InventoryItem[]
  loading: boolean
  error: string | null

  setWarehouses: (warehouses: Warehouse[]) => void
  addWarehouse: (warehouse: Warehouse) => void
  updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => void
  removeWarehouse: (id: string) => void

  setInventory: (inventory: InventoryItem[]) => void
  addInventoryItem: (item: InventoryItem) => void
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void
  removeInventoryItem: (id: string) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getWarehouseById: (id: string) => Warehouse | undefined
  getInventoryByWarehouse: (warehouseId: string) => InventoryItem[]
  getLowStockItems: () => InventoryItem[]
}

export const useWarehouseStore = create<WarehouseStore>((set, get) => ({
  warehouses: [],
  inventory: [],
  loading: false,
  error: null,

  setWarehouses: (warehouses) => set({ warehouses }),
  addWarehouse: (warehouse) =>
    set((state) => ({
      warehouses: [warehouse, ...state.warehouses],
    })),
  updateWarehouse: (id, warehouse) =>
    set((state) => ({
      warehouses: state.warehouses.map((w) =>
        w.id === id ? { ...w, ...warehouse } : w
      ),
    })),
  removeWarehouse: (id) =>
    set((state) => ({
      warehouses: state.warehouses.filter((w) => w.id !== id),
    })),

  setInventory: (inventory) => set({ inventory }),
  addInventoryItem: (item) =>
    set((state) => ({
      inventory: [item, ...state.inventory],
    })),
  updateInventoryItem: (id, item) =>
    set((state) => ({
      inventory: state.inventory.map((i) =>
        i.id === id ? { ...i, ...item } : i
      ),
    })),
  removeInventoryItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((i) => i.id !== id),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getWarehouseById: (id) => get().warehouses.find((w) => w.id === id),
  getInventoryByWarehouse: (warehouseId) =>
    get().inventory.filter((i) => i.warehouseId === warehouseId),
  getLowStockItems: () =>
    get().inventory.filter((i) => i.quantity <= i.reorderLevel),
}))
