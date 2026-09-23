import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const task = await prisma.maintenanceTask.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        spareParts: true,
      },
    })

    if (!task || task.vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch maintenance task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, actualCost, completedDate, notes } = body

    const existing = await prisma.maintenanceTask.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    })

    if (!existing || existing.vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const task = await prisma.maintenanceTask.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        actualCost: actualCost !== undefined ? actualCost : undefined,
        completedDate: completedDate ? new Date(completedDate) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        vehicle: true,
        spareParts: true,
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update maintenance task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.maintenanceTask.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    })

    if (!existing || existing.vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.maintenanceTask.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete maintenance task' }, { status: 500 })
  }
}
