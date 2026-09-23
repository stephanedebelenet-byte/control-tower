import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Eco-driving scoring algorithm
 * Composite metric (0-100) based on:
 * - Speed consistency (smooth acceleration/deceleration): 20%
 * - Acceleration smoothness: 20%
 * - Braking efficiency: 20%
 * - Fuel efficiency vs fleet avg: 20%
 * - RPM management: 20%
 */

function calculateEcoScore(telemetry: any): number {
  let score = 100

  // Speed variance penalty
  if (telemetry.accelerationX > 0.5 || telemetry.accelerationX < -0.5) {
    score -= 15
  }
  if (telemetry.accelerationY > 0.5 || telemetry.accelerationY < -0.5) {
    score -= 10
  }

  // Braking penalty
  if (telemetry.brakePressure > 0.7) {
    score -= 20
  } else if (telemetry.brakePressure > 0.4) {
    score -= 10
  }

  // RPM efficiency
  if (telemetry.rpm > 3000) {
    score -= 15
  } else if (telemetry.rpm > 2000) {
    score -= 5
  }

  // Speed efficiency
  if (telemetry.speed > 100) {
    score -= 20
  } else if (telemetry.speed > 80) {
    score -= 10
  }

  // Fuel consumption
  if (telemetry.fuelConsumptionRate > 0.08) {
    score -= 15
  } else if (telemetry.fuelConsumptionRate > 0.06) {
    score -= 8
  }

  return Math.max(0, Math.min(100, score))
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const vehicleId = req.nextUrl.searchParams.get('vehicleId')
    const daysBack = parseInt(req.nextUrl.searchParams.get('daysBack') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const scores = await prisma.dailyEcoScore.findMany({
      where: {
        vehicle: { organizationId: user.organizationId },
        ...(vehicleId && { vehicleId }),
        date: { gte: startDate },
      },
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch eco scores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, telemetry, date } = body

    if (!vehicleId || !telemetry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const ecoScore = calculateEcoScore(telemetry)

    const score = await prisma.dailyEcoScore.create({
      data: {
        vehicleId,
        date: date ? new Date(date) : new Date(),
        score: ecoScore,
        speedConsistency: 85 - (Math.abs(telemetry.accelerationX) * 50),
        accelerationSmootness: 90 - (Math.abs(telemetry.accelerationY) * 50),
        brakingEfficiency: Math.max(0, 100 - telemetry.brakePressure * 150),
        fuelEfficiency: Math.max(
          0,
          100 - telemetry.fuelConsumptionRate * 1000
        ),
        rpmManagement: Math.max(0, 100 - (telemetry.rpm / 50)),
      },
      include: {
        vehicle: true,
      },
    })

    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create eco score' }, { status: 500 })
  }
}
