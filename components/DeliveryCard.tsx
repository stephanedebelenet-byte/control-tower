'use client'

import { Delivery } from '@/stores/deliveries'
import { format } from 'date-fns'

interface DeliveryCardProps {
  delivery: Delivery
  onClick?: () => void
}

export function DeliveryCard({ delivery, onClick }: DeliveryCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    in_progress: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    completed: 'bg-green-500/10 text-green-300 border-green-500/30',
    cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
  }

  return (
    <div
      onClick={onClick}
      className="p-3 rounded-lg border border-cyan-500/20 bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-cyan-300 truncate">
            {delivery.productType}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {delivery.targetLocation}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border ${
            statusColors[delivery.status] || 'bg-slate-500/10 text-slate-300'
          }`}
        >
          {delivery.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-500">Qty</p>
          <p className="text-white font-medium">
            {delivery.quantity} {delivery.lines[0]?.unit || 'tons'}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Vehicle</p>
          <p className="text-white font-medium text-xs truncate">
            {delivery.vehicle?.name || 'Unassigned'}
          </p>
        </div>
      </div>

      {delivery.assignedDriver && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            Driver: {delivery.assignedDriver.name}
          </p>
        </div>
      )}
    </div>
  )
}
