'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Vehicle {
  id: string
  plateNumber: string
  status: string
  lastLocation?: {
    latitude: number
    longitude: number
    speed: number
  }
}

interface MapProps {
  vehicles: Vehicle[]
  onVehicleClick?: (vehicle: Vehicle) => void
}

export function Map({ vehicles, onVehicleClick }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>()

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([31.7917, -7.0926], 6)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    markersRef.current = new Map()
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    vehicles.forEach((vehicle) => {
      if (!vehicle.lastLocation) return

      const { latitude, longitude, speed } = vehicle.lastLocation
      const markerId = vehicle.id

      const color = {
        active: '#10B981',
        idle: '#3B82F6',
        maintenance: '#F59E0B',
        offline: '#6B7280',
      }[vehicle.status] || '#06B6D4'

      const icon = L.divIcon({
        html: `
          <div style="
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">🚛</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'vehicle-marker',
      })

      let marker = markersRef.current?.get(markerId)
      if (marker) {
        marker.setLatLng([latitude, longitude])
        marker.setIcon(icon)
      } else {
        marker = L.marker([latitude, longitude], { icon })
          .bindPopup(
            `<div style="font-size: 12px;">
              <strong>${vehicle.plateNumber}</strong><br/>
              Status: ${vehicle.status}<br/>
              Speed: ${speed.toFixed(1)} km/h
            </div>`
          )
          .on('click', () => onVehicleClick?.(vehicle))
          .addTo(mapRef.current!)

        markersRef.current?.set(markerId, marker)
      }
    })
  }, [vehicles, onVehicleClick])

  return (
    <div
      id="map"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '0.5rem',
        backgroundColor: '#0d2b4d',
      }}
    />
  )
}
