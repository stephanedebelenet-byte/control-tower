'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { useDeliveriesStore, type Delivery } from '@/stores/deliveries'
import { DeliveryCard } from '@/components/DeliveryCard'
import axios from 'axios'

export default function DeliveriesPage() {
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { deliveries, setDeliveries, setLoading, addDelivery } =
    useDeliveriesStore()
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/login')
      return
    }

    fetchDeliveries()
  }, [token, router, statusFilter])

  async function fetchDeliveries() {
    try {
      setLoading(true)
      const url =
        statusFilter === 'all'
          ? '/api/deliveries'
          : `/api/deliveries?status=${statusFilter}`

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setDeliveries(response.data)
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDeliveries =
    statusFilter === 'all'
      ? deliveries
      : deliveries.filter((d) => d.status === statusFilter)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 mb-2">
            Delivery Tasks
          </h1>
          <p className="text-slate-400">Manage transport requests and delivery status</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition"
          >
            New Delivery
          </button>

          <div className="flex gap-2">
            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
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

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-cyan-500/20">
            <h2 className="text-lg font-semibold mb-4">Create New Delivery</h2>
            {/* Form would go here in full implementation */}
            <p className="text-slate-400">Form implementation placeholder</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deliveries List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4">
              <h2 className="text-lg font-semibold mb-4">
                {filteredDeliveries.length} Deliveries
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredDeliveries.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No deliveries found
                  </p>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onClick={() => setSelectedDelivery(delivery)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div>
            {selectedDelivery ? (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4 sticky top-6">
                <h3 className="text-lg font-semibold mb-4 text-cyan-300">
                  Details
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">Product</p>
                    <p className="text-white font-medium">
                      {selectedDelivery.productType}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Target Location</p>
                    <p className="text-white font-medium">
                      {selectedDelivery.targetLocation}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Quantity</p>
                    <p className="text-white font-medium">
                      {selectedDelivery.quantity} tons
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Status</p>
                    <p className="text-white font-medium">
                      {selectedDelivery.status}
                    </p>
                  </div>

                  {selectedDelivery.vehicle && (
                    <div>
                      <p className="text-slate-500">Vehicle</p>
                      <p className="text-white font-medium">
                        {selectedDelivery.vehicle.name}
                      </p>
                    </div>
                  )}

                  {selectedDelivery.assignedDriver && (
                    <div>
                      <p className="text-slate-500">Driver</p>
                      <p className="text-white font-medium">
                        {selectedDelivery.assignedDriver.name}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedDelivery(null)}
                  className="w-full mt-4 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-lg border border-cyan-500/20 p-4 text-slate-500 text-center py-8">
                Select a delivery to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
