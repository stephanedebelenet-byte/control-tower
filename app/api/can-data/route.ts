import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * CAN Bus data ingestion
 * Receives telemetry from vehicle CAN interfaces
 * Parses OBD-II + custom frames
 */

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      vehicleId,
      timestamp,
      speed,
      rpm,
      engineTemp,
      coolantTemp,
      oilPressure,
      fuelRate,
      acceleratorPedalPos,
      brakePedalPos,
      throttlePos,
      gearPosition,
      odometer,
      faultCodes,
      voltage,
      amperage,
      batteryHealth,
      tirePressures,
      absActive,
      tcActive,
    } = body

    if (!vehicleId || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Update vehicle telemetry
    await prisma.vehicleTelemetry.create({
      data: {
        vehicleId,
        speed: speed || 0,
        rpm: rpm || 0,
        engineTemp: engineTemp || 0,
        coolantTemp: coolantTemp || 0,
        oilPressure: oilPressure || 0,
        fuelRate: fuelRate || 0,
        acceleratorPedalPos: acceleratorPedalPos || 0,
        brakePedalPos: brakePedalPos || 0,
        throttlePos: throttlePos || 0,
        gearPosition: gearPosition || 'P',
        odometer: odometer || 0,
        voltage: voltage || 0,
        amperage: amperage || 0,
        batteryHealth: batteryHealth || 100,
        tirePressures: tirePressures || {},
        absActive: absActive || false,
        tcActive: tcActive || false,
        timestamp: new Date(timestamp),
      },
    })

    // Track fault codes if any
    if (faultCodes && Array.isArray(faultCodes)) {
      for (const code of faultCodes) {
        const existing = await prisma.systemAlert.findFirst({
          where: {
            vehicleId,
            code: code.dtc,
            resolved: false,
          },
        })

        if (!existing) {
          await prisma.systemAlert.create({
            data: {
              vehicleId,
              code: code.dtc,
              description: code.description,
              severity: code.severity || 'warning',
              resolved: false,
            },
          })
        }
      }
    }

    // Check for critical conditions
    const alerts: string[] = []
    if (engineTemp > 110) alerts.push('Engine overheating')
    if (oilPressure < 20) alerts.push('Low oil pressure')
    if (batteryHealth < 50) alerts.push('Battery degradation')
    if (Object.values(tirePressures || {}).some((p: any) => p < 28)) {
      alerts.push('Low tire pressure')
    }

    return NextResponse.json(
      {
        success: true,
        vehicleId,
        alerts,
        faultCodeCount: faultCodes?.length || 0,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to ingest CAN data' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const vehicleId = req.nextUrl.searchParams.get('vehicleId')
    const hoursBack = parseInt(req.nextUrl.searchParams.get('hoursBack') || '24')

    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hoursBack)

    const telemetry = await prisma.vehicleTelemetry.findMany({
      where: {
        vehicle: { organizationId: user.organizationId },
        ...(vehicleId && { vehicleId }),
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    })

    return NextResponse.json(telemetry)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch CAN data' }, { status: 500 })
  }
}
