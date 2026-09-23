'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useWarehouseStore, type Warehouse, type InventoryItem } from '@/stores/warehouse'
import axios from 'axios'

export default function WarehousesPage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { warehouses, setWarehouses, inventory, setInventory, setLoading } =
    useWarehouseStore()
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchWarehouses()
    fetchInventory()
  }, [token, router])

  async function fetchWarehouses() {
    try {
      setLoading(true)
      const response = await axios.get('/api/warehouses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWarehouses(response.data)
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchInventory() {
    try {
      const response = await axios.get('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setInventory(response.data)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
  }

  const selectedInventory = selectedWarehouse
    ? inventory.filter((i) => i.warehouseId === selectedWarehouse.id)
    : []

  const totalCapacityUsed = selectedInventory.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Warehouse Management
          </h1>
          <p className="text-slate-400">Manage storage locations and inventory levels</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition"
          >
            New Warehouse
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-cyan-500/20">
            <h2 className="text-lg font-semibold mb-4">Create New Warehouse</h2>
            <p className="text-slate-400">Form implementation placeholder</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">
                {warehouses.length} Warehouses
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {warehouses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No warehouses</p>
                ) : (
                  warehouses.map((warehouse) => (
                    <button
                      key={warehouse.id}
                      onClick={() => setSelectedWarehouse(warehouse)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedWarehouse?.id === warehouse.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <p className="font-medium text-sm">{warehouse.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{warehouse.type}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Details & Inventory */}
          <div className="lg:col-span-2">
            {selectedWarehouse ? (
              <div className="space-y-4">
                {/* Warehouse Info */}
                <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                    {selectedWarehouse.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-500">Type</p>
                      <p className="text-white font-medium">
                        {selectedWarehouse.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Capacity</p>
                      <p className="text-white font-medium">
                        {selectedWarehouse.capacity
                          ? `${selectedWarehouse.capacity}T`
                          : 'Unlimited'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Location</p>
                      <p className="text-white font-medium text-xs">
                        {selectedWarehouse.latitude.toFixed(4)},{' '}
                        {selectedWarehouse.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {selectedWarehouse.capacity && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Capacity Used</p>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(totalCapacityUsed / selectedWarehouse.capacity) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {totalCapacityUsed}T / {selectedWarehouse.capacity}T
                      </p>
                    </div>
                  )}
                </div>

                {/* Inventory */}
                <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-cyan-300">
                      Inventory ({selectedInventory.length})
                    </h3>
                    <button className="px-3 py-1 text-xs bg-cyan-500 hover:bg-cyan-600 rounded transition">
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedInventory.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">
                        No inventory items
                      </p>
                    ) : (
                      selectedInventory.map((item) => {
                        const isLowStock = item.quantity <= item.reorderLevel
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border transition ${
                              isLowStock
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm">
                                {item.productType}
                              </p>
                              {isLowStock && (
                                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">
                              {item.quantity} {item.unit} (Reorder: {item.reorderLevel}{' '}
                              {item.unit})
                            </p>
                            <div className="w-full bg-slate-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isLowStock ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min((item.quantity / (item.reorderLevel * 2)) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-8 text-slate-500 text-center">
                <p>Select a warehouse to view inventory</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
