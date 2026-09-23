import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const warehouseId = req.nextUrl.searchParams.get('warehouseId')

    const where: any = { warehouse: { organizationId: user.organizationId } }
    if (warehouseId) where.warehouseId = warehouseId

    const inventory = await prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: true,
      },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { warehouseId, productType, quantity, unit, reorderLevel, notes } = body

    if (!warehouseId || !productType || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const warehouse = await prisma.warehouseLocation.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse || warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const item = await prisma.inventoryItem.create({
      data: {
        warehouseId,
        productType,
        quantity,
        unit: unit || 'tons',
        reorderLevel: reorderLevel || quantity * 0.2,
        notes: notes || null,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
