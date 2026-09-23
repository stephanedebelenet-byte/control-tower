import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Asset Management
 * RFID-tagged inventory tracking across supply chain
 */

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const status = req.nextUrl.searchParams.get('status') // 'in_warehouse' | 'in_transit' | 'delivered'

    // Fetch inventory with RFID tracking
    const inventory = await prisma.inventoryItem.findMany({
      where: { organizationId: user.organizationId },
      include: {
        warehouse: true,
      },
    })

    // Get latest RFID events per inventory item
    const assets = await Promise.all(
      inventory.map(async (item) => {
        const latestEvent = await prisma.rFIDEvent.findFirst({
          where: { tagId: item.id },
          orderBy: { timestamp: 'desc' },
        })

        // Determine asset status
        let assetStatus = 'in_warehouse'
        if (latestEvent) {
          if (latestEvent.readerType === 'vehicle') {
            assetStatus = 'in_transit'
          } else if (latestEvent.readerType === 'checkpoint') {
            assetStatus = 'delivered'
          }
        }

        if (status && assetStatus !== status) {
          return null
        }

        return {
          assetId: item.id,
          rfidTag: item.id,
          productType: item.productType,
          quantity: item.quantity,
          unit: item.unit,
          status: assetStatus,
          currentLocation: latestEvent?.location || item.warehouse.name,
          lastSeen: latestEvent?.timestamp || item.createdAt,
          warehouse: item.warehouse,
          trackingHistory: await prisma.rFIDEvent.findMany({
            where: { tagId: item.id },
            orderBy: { timestamp: 'desc' },
            take: 10,
          }),
        }
      })
    )

    return NextResponse.json(assets.filter((a) => a !== null))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { warehouseId, productType, quantity, unit, rfidTag, notes } = body

    if (!warehouseId || !productType || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const warehouse = await prisma.warehouseLocation.findUnique({
      where: { id: warehouseId },
    })

    if (!warehouse || warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    const asset = await prisma.inventoryItem.create({
      data: {
        warehouseId,
        productType,
        quantity,
        unit,
        notes: notes || null,
      },
    })

    // Record initial RFID tag if provided
    if (rfidTag) {
      await prisma.rFIDEvent.create({
        data: {
          organizationId: user.organizationId,
          tagId: rfidTag,
          readerId: warehouseId,
          readerType: 'warehouse',
          location: warehouse.name,
        },
      })
    }

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
