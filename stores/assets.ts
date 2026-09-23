import { create } from 'zustand'

export interface RFIDEvent {
  id: string
  tagId: string
  readerId: string
  readerType: 'warehouse' | 'vehicle' | 'checkpoint'
  location: string | null
  timestamp: string
  signalStrength: number
}

export interface Asset {
  assetId: string
  rfidTag: string
  productType: string
  quantity: number
  unit: string
  status: 'in_warehouse' | 'in_transit' | 'delivered'
  currentLocation: string
  lastSeen: string
  trackingHistory: RFIDEvent[]
}

interface AssetsStore {
  assets: Asset[]
  rfidEvents: RFIDEvent[]
  loading: boolean
  error: string | null

  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Asset) => void
  updateAssetStatus: (assetId: string, status: Asset['status']) => void

  setRFIDEvents: (events: RFIDEvent[]) => void
  addRFIDEvent: (event: RFIDEvent) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getAssetById: (assetId: string) => Asset | undefined
  getAssetsByStatus: (status: Asset['status']) => Asset[]
  getInTransitAssets: () => Asset[]
  getDeliveredAssets: () => Asset[]
  getAssetTrajectory: (assetId: string) => RFIDEvent[]
}

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  assets: [],
  rfidEvents: [],
  loading: false,
  error: null,

  setAssets: (assets) => set({ assets }),
  addAsset: (asset) =>
    set((state) => ({
      assets: [asset, ...state.assets],
    })),
  updateAssetStatus: (assetId, status) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.assetId === assetId ? { ...a, status } : a
      ),
    })),

  setRFIDEvents: (events) => set({ rfidEvents: events }),
  addRFIDEvent: (event) =>
    set((state) => ({
      rfidEvents: [event, ...state.rfidEvents],
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getAssetById: (assetId) =>
    get().assets.find((a) => a.assetId === assetId),

  getAssetsByStatus: (status) =>
    get().assets.filter((a) => a.status === status),

  getInTransitAssets: () =>
    get().assets.filter((a) => a.status === 'in_transit'),

  getDeliveredAssets: () =>
    get().assets.filter((a) => a.status === 'delivered'),

  getAssetTrajectory: (assetId) => {
    const asset = get().assets.find((a) => a.assetId === assetId)
    return asset?.trackingHistory || []
  },
}))
