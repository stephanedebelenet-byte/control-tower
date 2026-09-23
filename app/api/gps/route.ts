import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

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

    const { vehicleId, latitude, longitude, speed, heading, accuracy } = await req.json()

    if (!vehicleId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify vehicle belongs to organization
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        organizationId: payload.organizationId,
      },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Record GPS point
    const gpsRecord = await prisma.vehicleGPS.create({
      data: {
        vehicleId,
        latitude,
        longitude,
        speed: speed || 0,
        heading,
        accuracy,
      },
    })

    // Update vehicle current location
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        currentLocation: `${latitude},${longitude}`,
        lastSeenAt: new Date(),
        status: speed > 5 ? 'active' : 'idle',
      },
    })

    return NextResponse.json(gpsRecord, { status: 201 })
  } catch (error) {
    console.error('GPS record error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(req.url)
    const vehicleId = searchParams.get('vehicleId')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where = vehicleId
      ? { vehicleId }
      : {
          vehicle: { organizationId: payload.organizationId },
        }

    const gpsData = await prisma.vehicleGPS.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json(gpsData)
  } catch (error) {
    console.error('Get GPS data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
