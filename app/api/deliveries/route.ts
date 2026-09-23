import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const status = req.nextUrl.searchParams.get('status')
    const vehicleId = req.nextUrl.searchParams.get('vehicleId')

    const where: any = { organizationId: user.organizationId }
    if (status) where.status = status
    if (vehicleId) where.vehicleId = vehicleId

    const deliveries = await prisma.deliveryTask.findMany({
      where,
      include: {
        lines: true,
        vehicle: { select: { id: true, name: true, status: true } },
        assignedDriver: { select: { id: true, name: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(deliveries)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, driverId, warehouseId, targetLocation, productType, quantity, notes } = body

    if (!vehicleId || !targetLocation || !productType || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const delivery = await prisma.deliveryTask.create({
      data: {
        organizationId: user.organizationId,
        vehicleId,
        driverId: driverId || null,
        warehouseId: warehouseId || null,
        targetLocation,
        productType,
        quantity,
        notes: notes || null,
        status: 'pending',
        lines: {
          create: [
            {
              lineNumber: 1,
              productType,
              quantity,
              unit: 'tons',
            },
          ],
        },
      },
      include: {
        lines: true,
        vehicle: true,
        assignedDriver: true,
      },
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 })
  }
}
