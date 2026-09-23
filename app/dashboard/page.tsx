'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { FleetTracker } from '@/components/FleetTracker'
import io from 'socket.io-client'

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [view, setView] = useState<'tracker' | 'classic'>('tracker')

  useEffect(() => {
    if (!token || !user) {
      window.location.href = '/login'
      return
    }

    // Connect to Socket.IO for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      auth: { token },
    })

    socket.on('connect', () => {
      console.log('Socket connected for fleet tracking')
      socket.emit('subscribe-fleet', { organizationId: user.organizationId })
    })

    socket.on('vehicle-update', (data: any) => {
      console.log('Real-time vehicle update:', data)
      // Updates handled by FleetTracker component via React Query
    })

    return () => {
      socket.disconnect()
    }
  }, [token, user])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="view-selector border-b bg-white p-3" style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setView('tracker')}
          style={{
            padding: '8px 16px',
            background: view === 'tracker' ? '#1e40af' : '#e2e8f0',
            color: view === 'tracker' ? 'white' : '#1e293b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Real-Time Tracker (FMC650)
        </button>
        <button
          onClick={() => setView('classic')}
          style={{
            padding: '8px 16px',
            background: view === 'classic' ? '#1e40af' : '#e2e8f0',
            color: view === 'classic' ? 'white' : '#1e293b',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Classic View
        </button>
      </div>

      {view === 'tracker' ? (
        <FleetTracker />
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
          Classic view coming soon...
        </div>
      )}
    </div>
  )
}
