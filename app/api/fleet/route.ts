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

    // Get all vehicles with latest GPS
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: payload.organizationId },
      include: {
        gpsHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        telemetry: true,
      },
    })

    // Calculate metrics
    const totalVehicles = vehicles.length
    const activeVehicles = vehicles.filter((v) => v.status === 'active').length
    const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0)
    const totalWeight = vehicles.reduce((sum, v) => sum + v.currentWeight, 0)

    // Get today's deliveries
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const deliveries = await prisma.deliveryTask.findMany({
      where: {
        organizationId: payload.organizationId,
        createdAt: { gte: today },
      },
    })

    const completedDeliveries = deliveries.filter(
      (d) => d.status === 'completed'
    ).length

    // Get fuel consumption
    const fuelConsumption = await prisma.fuelConsumption.findMany({
      where: {
        vehicle: { organizationId: payload.organizationId },
        timestamp: { gte: today },
      },
    })

    const totalDistance = fuelConsumption.reduce((sum, f) => sum + f.distance, 0)
    const totalFuel = fuelConsumption.reduce((sum, f) => sum + f.consumedQuantity, 0)

    return NextResponse.json({
      metrics: {
        totalVehicles,
        activeVehicles,
        totalCapacity,
        totalWeight,
        utilization: (totalWeight / totalCapacity) * 100,
        totalDeliveries: deliveries.length,
        completedDeliveries,
        totalDistance: Math.round(totalDistance),
        totalFuel: Math.round(totalFuel),
      },
      vehicles: vehicles.map((v) => ({
        id: v.id,
        plateNumber: v.plateNumber,
        status: v.status,
        capacity: v.capacity,
        currentWeight: v.currentWeight,
        lastLocation: v.gpsHistory[0]
          ? {
              latitude: v.gpsHistory[0].latitude,
              longitude: v.gpsHistory[0].longitude,
              speed: v.gpsHistory[0].speed,
            }
          : null,
        telemetry: v.telemetry,
      })),
    })
  } catch (error) {
    console.error('Fleet metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
