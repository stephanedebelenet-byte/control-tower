import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const url = new URL(req.url)
    const includeGPS = url.searchParams.get('includeGPS') === 'true'
    const includeMetrics = url.searchParams.get('includeMetrics') === 'true'

    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: payload.organizationId },
      include: {
        ...(includeGPS || includeMetrics) && {
          gpsHistory: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          telemetry: true,
        },
        ...(includeMetrics) && {
          ecoScores: {
            orderBy: { date: 'desc' },
            take: 1,
          },
          alerts: {
            where: { isResolved: false },
            take: 5,
          },
        },
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

    // Transform response for real-time tracking
    if (includeGPS || includeMetrics) {
      const enrichedVehicles = vehicles.map(vehicle => {
        const gpsData = vehicle.gpsHistory?.[0]
        const telemetry = vehicle.telemetry
        const ecoScore = vehicle.ecoScores?.[0]
        const alerts = vehicle.alerts?.map((a: any) => a.message) || []

        return {
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
          latitude: gpsData?.latitude || 31.6295,
          longitude: gpsData?.longitude || -8.0047,
          speed: telemetry?.speed || gpsData?.speed || 0,
          heading: gpsData?.heading,
          fuelLevel: telemetry?.fuelLevel || 75,
          temperature: telemetry?.engineTemp || 80,
          distance: vehicle.currentWeight ? Math.round(vehicle.currentWeight * 1000) : 0,
          ecoScore: ecoScore?.ecoScore || 75,
          driverId: vehicle.driver?.id,
          driverName: vehicle.driver?.name,
          lastUpdate: gpsData?.timestamp || vehicle.lastSeenAt || new Date(),
          alerts,
          fmc650: telemetry ? {
            rpm: telemetry.rpm,
            fuelRate: telemetry.fuelRate,
            acceleration: {
              x: telemetry.accelerationX,
              y: telemetry.accelerationY,
              z: telemetry.accelerationZ,
            },
            tires: {
              frontRight: telemetry.tirePressureFR,
              frontLeft: telemetry.tirePressureFL,
              rearRight: telemetry.tirePressureRR,
              rearLeft: telemetry.tirePressureRL,
            },
            battery: telemetry.batteryVoltage,
            brakePressure: telemetry.brakePressure,
          } : null,
        }
      })

      return NextResponse.json(enrichedVehicles)
    }

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Get vehicles error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { plateNumber, capacity } = await req.json()

    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId: payload.organizationId,
        plateNumber,
        capacity,
        registrationDate: new Date(),
        status: 'idle',
      },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Create vehicle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
