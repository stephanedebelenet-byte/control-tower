import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const delivery = await prisma.deliveryTask.findUnique({
      where: { id: params.id },
      include: {
        lines: true,
        vehicle: true,
        assignedDriver: true,
        warehouse: true,
      },
    })

    if (!delivery || delivery.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch delivery' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, driverId, notes, actualDeliveryTime } = body

    const existing = await prisma.deliveryTask.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const delivery = await prisma.deliveryTask.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        driverId: driverId !== undefined ? driverId : undefined,
        notes: notes !== undefined ? notes : undefined,
        actualDeliveryTime: actualDeliveryTime ? new Date(actualDeliveryTime) : undefined,
      },
      include: {
        lines: true,
        vehicle: true,
        assignedDriver: true,
      },
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.deliveryTask.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.deliveryTask.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete delivery' }, { status: 500 })
  }
}
