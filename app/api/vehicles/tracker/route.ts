import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const includeGPS = searchParams.get('includeGPS') === 'true'
    const includeMetrics = searchParams.get('includeMetrics') === 'true'
    const organizationId = searchParams.get('organizationId')

    // Get vehicles with real-time data
    const vehicles = await prisma.vehicle.findMany({
      where: organizationId ? { organizationId } : undefined,
      select: {
        id: true,
        plateNumber: true,
        status: true,
        currentLocation: true,
        currentWeight: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        ...(includeGPS && {
          gpsHistory: {
            select: {
              latitude: true,
              longitude: true,
              speed: true,
              heading: true,
              accuracy: true,
              timestamp: true,
            },
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        }),
        ...(includeMetrics && {
          telemetry: {
            select: {
              speed: true,
              rpm: true,
              engineTemp: true,
              fuelLevel: true,
              fuelRate: true,
              accelerationX: true,
              accelerationY: true,
              accelerationZ: true,
              brakePressure: true,
              tirePressureFR: true,
              tirePressureFL: true,
              tirePressureRR: true,
              tirePressureRL: true,
              batteryVoltage: true,
              odometer: true,
              updatedAt: true,
            },
          },
          ecoScores: {
            select: {
              ecoScore: true,
              speedScore: true,
              accelerationScore: true,
              brakingScore: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 1,
          },
          alerts: {
            where: { isResolved: false },
            select: {
              id: true,
              type: true,
              message: true,
              severity: true,
              createdAt: true,
            },
            take: 5,
          },
        }),
        driver: {
          select: {
            id: true,
            name: true,
            licenseNumber: true,
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    })

    // Transform response to include GPS and metrics
    const enrichedVehicles = vehicles.map(vehicle => {
      const gpsData = includeGPS && vehicle.gpsHistory?.[0]
        ? vehicle.gpsHistory[0]
        : null

      const telemetry = includeMetrics && vehicle.telemetry
        ? vehicle.telemetry
        : null

      const ecoScore = includeMetrics && vehicle.ecoScores?.[0]
        ? vehicle.ecoScores[0]
        : null

      const alerts = includeMetrics && vehicle.alerts
        ? vehicle.alerts.map(a => a.message)
        : []

      return {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        status: vehicle.status,
        latitude: gpsData?.latitude || 31.6295, // Default to Morocco
        longitude: gpsData?.longitude || -8.0047,
        speed: telemetry?.speed || gpsData?.speed || 0,
        heading: gpsData?.heading,
        fuelLevel: telemetry?.fuelLevel || 75,
        temperature: telemetry?.engineTemp || 80,
        distance: Math.round((telemetry?.odometer || 0) / 1000) * 1000,
        ecoScore: ecoScore?.ecoScore || 75,
        driverId: vehicle.driver?.id,
        driverName: vehicle.driver?.name,
        lastUpdate: gpsData?.timestamp || vehicle.lastSeenAt || new Date(),
        alerts,
        // FMC650 specific data
        fmc650: {
          rpm: telemetry?.rpm,
          fuelRate: telemetry?.fuelRate,
          acceleration: {
            x: telemetry?.accelerationX,
            y: telemetry?.accelerationY,
            z: telemetry?.accelerationZ,
          },
          tires: {
            frontRight: telemetry?.tirePressureFR,
            frontLeft: telemetry?.tirePressureFL,
            rearRight: telemetry?.tirePressureRR,
            rearLeft: telemetry?.tirePressureRL,
          },
          battery: telemetry?.batteryVoltage,
          brakePressure: telemetry?.brakePressure,
        },
      }
    })

    return NextResponse.json(enrichedVehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

// WebSocket upgrade for real-time tracking
export async function UPGRADE(req: NextRequest) {
  const { socket, headers } = Bun.upgrade(req, {
    data: { timestamp: Date.now() },
  })

  socket.onopen = () => {
    console.log('Vehicle tracking client connected')
    // Send initial data
    socket.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }))
  }

  socket.onmessage = async (message) => {
    const data = JSON.parse(message.data)

    if (data.type === 'subscribe') {
      // Subscribe to vehicle updates
      const { vehicleId, organizationId } = data

      // Fetch and send vehicle data
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          ...(organizationId && { organizationId }),
        },
        include: {
          gpsHistory: { orderBy: { timestamp: 'desc' }, take: 1 },
          telemetry: true,
          ecoScores: { orderBy: { date: 'desc' }, take: 1 },
        },
      })

      if (vehicle) {
        socket.send(
          JSON.stringify({
            type: 'vehicle-update',
            data: vehicle,
            timestamp: Date.now(),
          })
        )
      }
    }
  }

  socket.onclose = () => {
    console.log('Vehicle tracking client disconnected')
  }

  return new Response('WebSocket upgraded', { status: 101 })
}
