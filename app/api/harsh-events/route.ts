import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const vehicleId = req.nextUrl.searchParams.get('vehicleId')
    const severity = req.nextUrl.searchParams.get('severity')

    const where: any = { alert: { vehicle: { organizationId: user.organizationId } } }
    if (vehicleId) where.alert.vehicleId = vehicleId
    if (severity) where.alert.severity = severity

    const events = await prisma.vehicleAlert.findMany({
      where: { vehicle: { organizationId: user.organizationId } },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch harsh events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, eventType, severity, value, location, notes } = body

    if (!vehicleId || !eventType || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Determine alert type
    let alertType = 'normal'
    if (eventType === 'harsh_braking' && value > 0.7) {
      alertType = 'harsh_braking'
    } else if (eventType === 'harsh_acceleration' && value > 0.6) {
      alertType = 'harsh_acceleration'
    } else if (eventType === 'speeding' && value > 110) {
      alertType = 'speeding'
    } else if (eventType === 'sharp_turn' && value > 0.8) {
      alertType = 'sharp_turn'
    }

    const event = await prisma.vehicleAlert.create({
      data: {
        vehicleId,
        type: alertType as any,
        severity: severity as any,
        message: `${eventType}: ${value}`,
        metadata: {
          eventType,
          value,
          location,
          notes,
        },
        resolved: false,
      },
      include: {
        vehicle: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to record harsh event' }, { status: 500 })
  }
}
