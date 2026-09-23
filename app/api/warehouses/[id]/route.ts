import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const warehouse = await prisma.warehouseLocation.findUnique({
      where: { id: params.id },
      include: {
        inventory: true,
      },
    })

    if (!warehouse || warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, type, latitude, longitude, capacity, notes } = body

    const existing = await prisma.warehouseLocation.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const warehouse = await prisma.warehouseLocation.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        type: type || undefined,
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        capacity: capacity !== undefined ? capacity : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    })

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 })
  }
}
