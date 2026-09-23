import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const maintenanceTaskId = req.nextUrl.searchParams.get('maintenanceTaskId')

    const where: any = { maintenanceTask: { vehicle: { organizationId: user.organizationId } } }
    if (maintenanceTaskId) where.maintenanceTaskId = maintenanceTaskId

    const parts = await prisma.sparePart.findMany({
      where,
      include: {
        maintenanceTask: true,
      },
    })

    return NextResponse.json(parts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch spare parts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { maintenanceTaskId, partName, quantity, unitPrice, notes } = body

    if (!maintenanceTaskId || !partName || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const task = await prisma.maintenanceTask.findUnique({
      where: { id: maintenanceTaskId },
      include: { vehicle: true },
    })

    if (!task || task.vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Maintenance task not found' }, { status: 404 })
    }

    const part = await prisma.sparePart.create({
      data: {
        maintenanceTaskId,
        partName,
        quantity,
        unitPrice,
        notes: notes || null,
      },
      include: {
        maintenanceTask: true,
      },
    })

    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create spare part' }, { status: 500 })
  }
}
