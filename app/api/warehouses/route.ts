import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const warehouses = await prisma.warehouseLocation.findMany({
      where: { organizationId: user.organizationId },
      include: {
        inventory: true,
      },
    })

    return NextResponse.json(warehouses)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, type, latitude, longitude, capacity, notes } = body

    if (!name || !type || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const warehouse = await prisma.warehouseLocation.create({
      data: {
        organizationId: user.organizationId,
        name,
        type,
        latitude,
        longitude,
        capacity: capacity || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
  }
}
