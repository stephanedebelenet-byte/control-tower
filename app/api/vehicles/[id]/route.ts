import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.id,
        organizationId: payload.organizationId,
      },
      include: {
        telemetry: true,
        gpsHistory: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
        maintenanceTasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Get vehicle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { status, currentWeight, currentLocation } = await req.json()

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(currentWeight !== undefined && { currentWeight }),
        ...(currentLocation && { currentLocation, lastSeenAt: new Date() }),
      },
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('Update vehicle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
