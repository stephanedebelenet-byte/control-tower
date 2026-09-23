'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useAssetsStore, type Asset } from '@/stores/assets'
import axios from 'axios'

export default function AssetsPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const {
    assets,
    setAssets,
    setLoading,
    getAssetsByStatus,
    getInTransitAssets,
  } = useAssetsStore()

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchAssets()
    const interval = setInterval(fetchAssets, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [token, router, statusFilter])

  async function fetchAssets() {
    try {
      setLoading(true)
      const url =
        statusFilter === 'all'
          ? '/api/assets'
          : `/api/assets?status=${statusFilter}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setAssets(response.data)
    } catch (error) {
      console.error('Failed to fetch assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const inTransit = getInTransitAssets()
  const filteredAssets =
    statusFilter === 'all'
      ? assets
      : getAssetsByStatus(statusFilter as Asset['status'])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Asset Tracking (RFID)
          </h1>
          <p className="text-slate-400">
            Real-time cargo location via RFID tag detection
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
            <p className="text-cyan-300 text-sm mb-1">Total Assets</p>
            <p className="text-3xl font-bold text-cyan-400">{assets.length}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-4">
            <p className="text-yellow-300 text-sm mb-1">In Transit</p>
            <p className="text-3xl font-bold text-yellow-400">{inTransit.length}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
            <p className="text-green-300 text-sm mb-1">Delivered</p>
            <p className="text-3xl font-bold text-green-400">
              {getAssetsByStatus('delivered').length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <div className="flex gap-2">
            {['all', 'in_warehouse', 'in_transit', 'delivered'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assets List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">
                {filteredAssets.length} Assets
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAssets.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No assets</p>
                ) : (
                  filteredAssets.map((asset) => (
                    <button
                      key={asset.assetId}
                      onClick={() => setSelectedAsset(asset)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedAsset?.assetId === asset.assetId
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-sm text-cyan-300">
                        {asset.productType}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {asset.quantity} {asset.unit}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            asset.status === 'in_warehouse'
                              ? 'bg-blue-500'
                              : asset.status === 'in_transit'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                        />
                        <span className="text-xs text-slate-400">
                          {asset.status.replace('_', ' ')}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Asset Details & Tracking */}
          <div className="lg:col-span-2">
            {selectedAsset ? (
              <div className="space-y-4">
                {/* Asset Info */}
                <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                    Asset Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500">Product Type</p>
                      <p className="text-white font-medium">
                        {selectedAsset.productType}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Quantity</p>
                      <p className="text-white font-medium">
                        {selectedAsset.quantity} {selectedAsset.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">RFID Tag</p>
                      <p className="text-white font-mono text-xs">
                        {selectedAsset.rfidTag.slice(-8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Current Location</p>
                      <p className="text-white font-medium">
                        {selectedAsset.currentLocation}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-500 text-sm mb-2">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedAsset.status === 'in_warehouse'
                          ? 'bg-blue-500/20 text-blue-300'
                          : selectedAsset.status === 'in_transit'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {selectedAsset.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Tracking History */}
                <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                    Tracking History
                  </h3>

                  <div className="space-y-2">
                    {selectedAsset.trackingHistory.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">
                        No tracking events
                      </p>
                    ) : (
                      selectedAsset.trackingHistory.map((event, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-white">
                                {event.readerType.toUpperCase()}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {event.location || 'Location unknown'}
                              </p>
                            </div>
                            <span className="text-xs text-slate-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {event.signalStrength > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                              Signal: {event.signalStrength}%
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-slate-500 text-center">
                Select an asset to view tracking details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
