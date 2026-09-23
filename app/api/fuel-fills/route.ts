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
    const tankId = req.nextUrl.searchParams.get('tankId')

    const where: any = { vehicle: { organizationId: user.organizationId } }
    if (vehicleId) where.vehicleId = vehicleId
    if (tankId) where.fuelTankId = tankId

    const fills = await prisma.fuelFill.findMany({
      where,
      include: {
        vehicle: true,
        fuelTank: true,
      },
      orderBy: { filledAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(fills)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch fuel fills' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, fuelTankId, quantityLiters, cost, notes } = body

    if (!vehicleId || !fuelTankId || !quantityLiters) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const tank = await prisma.fuelTank.findUnique({
      where: { id: fuelTankId },
    })

    if (!tank || tank.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Fuel tank not found' }, { status: 404 })
    }

    // Update tank level
    const newLevel = Math.min(tank.currentLevel + quantityLiters, tank.capacity)
    await prisma.fuelTank.update({
      where: { id: fuelTankId },
      data: { currentLevel: newLevel },
    })

    // Record fuel fill
    const fill = await prisma.fuelFill.create({
      data: {
        vehicleId,
        fuelTankId,
        quantityLiters,
        cost: cost || 0,
        notes: notes || null,
        filledAt: new Date(),
      },
      include: {
        vehicle: true,
        fuelTank: true,
      },
    })

    return NextResponse.json(fill, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to record fuel fill' }, { status: 500 })
  }
}
