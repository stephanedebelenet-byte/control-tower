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

    // Get active fault codes
    const faultCodes = await prisma.systemAlert.findMany({
      where: {
        vehicle: { organizationId: user.organizationId },
        ...(vehicleId && { vehicleId }),
        resolved: false,
      },
      include: {
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get latest telemetry per vehicle
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: user.organizationId },
      ...(vehicleId && { where: { id: vehicleId } }),
    })

    const diagnostics = await Promise.all(
      vehicles.map(async (vehicle) => {
        const latest = await prisma.vehicleTelemetry.findFirst({
          where: { vehicleId: vehicle.id },
          orderBy: { timestamp: 'desc' },
        })

        const alerts = faultCodes.filter((f) => f.vehicleId === vehicle.id)

        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
          lastUpdate: latest?.timestamp,
          telemetry: latest
            ? {
                speed: latest.speed,
                rpm: latest.rpm,
                engineTemp: latest.engineTemp,
                coolantTemp: latest.coolantTemp,
                oilPressure: latest.oilPressure,
                batteryHealth: latest.batteryHealth,
                odometer: latest.odometer,
              }
            : null,
          faultCodes: alerts.map((a) => ({
            code: a.code,
            description: a.description,
            severity: a.severity,
          })),
          health: calculateVehicleHealth(latest, alerts),
        }
      })
    )

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch diagnostics' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, faultCodeId, action } = body

    if (!vehicleId || !faultCodeId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fault = await prisma.systemAlert.findUnique({
      where: { id: faultCodeId },
      include: { vehicle: true },
    })

    if (!fault || fault.vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Fault code not found' }, { status: 404 })
    }

    if (action === 'acknowledge') {
      await prisma.systemAlert.update({
        where: { id: faultCodeId },
        data: { acknowledged: true },
      })
    } else if (action === 'resolve') {
      await prisma.systemAlert.update({
        where: { id: faultCodeId },
        data: { resolved: true, resolvedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update fault code' }, { status: 500 })
  }
}

function calculateVehicleHealth(telemetry: any, faultCodes: any[]): number {
  let score = 100

  if (!telemetry) return 50

  // Telemetry-based penalties
  if (telemetry.engineTemp > 110) score -= 20
  if (telemetry.oilPressure < 20) score -= 15
  if (telemetry.batteryHealth < 80) score -= 10
  if (telemetry.batteryHealth < 50) score -= 20

  // Fault code penalties
  const criticalFaults = faultCodes.filter((f) => f.severity === 'critical').length
  const warningFaults = faultCodes.filter((f) => f.severity === 'warning').length

  score -= criticalFaults * 15
  score -= warningFaults * 5

  return Math.max(0, Math.min(100, score))
}
