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

    const where: any = { vehicle: { organizationId: user.organizationId } }
    if (status) where.status = status
    if (vehicleId) where.vehicleId = vehicleId

    const tasks = await prisma.maintenanceTask.findMany({
      where,
      include: {
        vehicle: true,
        spareParts: true,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 100,
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch maintenance tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, taskType, description, scheduledDate, estimatedCost, notes } = body

    if (!vehicleId || !taskType || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const task = await prisma.maintenanceTask.create({
      data: {
        vehicleId,
        taskType,
        description: description || null,
        scheduledDate: new Date(scheduledDate),
        estimatedCost: estimatedCost || 0,
        notes: notes || null,
        status: 'scheduled',
      },
      include: {
        vehicle: true,
        spareParts: true,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create maintenance task' }, { status: 500 })
  }
}
