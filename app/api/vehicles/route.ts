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

    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: payload.organizationId },
      include: {
        telemetry: true,
        gpsHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })

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
