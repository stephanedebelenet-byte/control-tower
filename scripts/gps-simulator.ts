import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const ADMIN_EMAIL = 'admin@mojazine.ma'
const ADMIN_PASSWORD = 'demo123456'

// Maroc bounds
const MAROC = {
  minLat: 27.12,
  maxLat: 35.94,
  minLng: -13.2,
  maxLng: -1.02,
}

// Demo depots
const DEPOTS = [
  { name: 'Tangier', lat: 35.9425, lng: -5.3211 },
  { name: 'Jorf', lat: 33.2639, lng: -8.6328 },
  { name: 'Agadir', lat: 30.4278, lng: -9.5981 },
]

interface Vehicle {
  id: string
  plateNumber: string
}

class GPSSimulator {
  token: string = ''
  orgId: string = ''
  vehicles: Vehicle[] = []
  vehicleState: Map<string, any> = new Map()

  async init() {
    try {
      // Login
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })

      this.token = loginRes.data.token
      this.orgId = loginRes.data.user.organizationId
      console.log('✓ Logged in as admin')

      // Fetch vehicles
      const vehiclesRes = await axios.get(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })

      this.vehicles = vehiclesRes.data
      console.log(`✓ Found ${this.vehicles.length} vehicles`)

      // Initialize vehicle state
      this.vehicles.forEach((v) => {
        const depot = DEPOTS[Math.floor(Math.random() * DEPOTS.length)]
        this.vehicleState.set(v.id, {
          lat: depot.lat + (Math.random() - 0.5) * 0.1,
          lng: depot.lng + (Math.random() - 0.5) * 0.1,
          speed: 0,
          targetLat: DEPOTS[(DEPOTS.indexOf(depot) + 1) % DEPOTS.length].lat,
          targetLng: DEPOTS[(DEPOTS.indexOf(depot) + 1) % DEPOTS.length].lng,
        })
      })

      console.log('✓ GPS Simulator initialized')
    } catch (error) {
      console.error('Init failed:', error)
      process.exit(1)
    }
  }

  async simulateStep() {
    for (const vehicle of this.vehicles) {
      const state = this.vehicleState.get(vehicle.id)
      if (!state) continue

      // Move toward target
      const dLat = state.targetLat - state.lat
      const dLng = state.targetLng - state.lng
      const distance = Math.sqrt(dLat * dLat + dLng * dLng)

      if (distance < 0.01) {
        // Reached target, pick new depot
        const randomDepot = DEPOTS[Math.floor(Math.random() * DEPOTS.length)]
        state.targetLat = randomDepot.lat
        state.targetLng = randomDepot.lng
      } else {
        // Move 5% toward target
        const step = 0.05
        state.lat += (dLat / distance) * step * 0.01
        state.lng += (dLng / distance) * step * 0.01
        state.speed = Math.random() * 100 // 0-100 km/h
      }

      // Clamp to Maroc bounds
      state.lat = Math.max(MAROC.minLat, Math.min(MAROC.maxLat, state.lat))
      state.lng = Math.max(MAROC.minLng, Math.min(MAROC.maxLng, state.lng))

      // Send GPS update
      try {
        await axios.post(
          `${API_URL}/gps`,
          {
            vehicleId: vehicle.id,
            latitude: state.lat,
            longitude: state.lng,
            speed: state.speed,
            heading: Math.random() * 360,
          },
          { headers: { Authorization: `Bearer ${this.token}` } }
        )
      } catch (error: any) {
        console.error(`Failed to update GPS for ${vehicle.plateNumber}:`, error.message)
      }
    }
  }

  async start() {
    console.log('🚛 GPS Simulator started. Sending updates every 5 seconds...')
    setInterval(() => this.simulateStep(), 5000)
  }
}

const simulator = new GPSSimulator()
simulator.init().then(() => simulator.start())
