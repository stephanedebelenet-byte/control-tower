import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * RFID Event Ingestion
 * Track asset movements via RFID readers at:
 * - Warehouses (pickup/storage)
 * - Vehicles (in-transit)
 * - Job sites/chantiers (delivery)
 */

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { tagId, readerId, readerType, location, timestamp, signal_strength } = body

    if (!tagId || !readerId || !readerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Record RFID event
    const event = await prisma.rFIDEvent.create({
      data: {
        organizationId: user.organizationId,
        tagId,
        readerId,
        readerType: readerType as any, // 'warehouse' | 'vehicle' | 'checkpoint'
        location: location || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        signalStrength: signal_strength || 0,
      },
    })

    // Auto-tag delivery if cargo detected at warehouse or checkpoint
    if (readerType === 'checkpoint' || readerType === 'warehouse') {
      // Match RFID tag to delivery task (via InventoryItem with tagId)
      const item = await prisma.inventoryItem.findFirst({
        where: { organizationId: user.organizationId },
      })

      if (item) {
        const delivery = await prisma.deliveryTask.findFirst({
          where: {
            organizationId: user.organizationId,
            productType: item.productType,
            status: 'in_progress',
          },
        })

        if (delivery) {
          // Log asset location for this delivery
          await prisma.rFIDEvent.update({
            where: { id: event.id },
            data: {
              metadata: {
                deliveryId: delivery.id,
                warehouseId: item.warehouseId,
              },
            },
          })
        }
      }
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to ingest RFID event' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tagId = req.nextUrl.searchParams.get('tagId')
    const readerId = req.nextUrl.searchParams.get('readerId')
    const hoursBack = parseInt(req.nextUrl.searchParams.get('hoursBack') || '24')

    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hoursBack)

    const events = await prisma.rFIDEvent.findMany({
      where: {
        organizationId: user.organizationId,
        ...(tagId && { tagId }),
        ...(readerId && { readerId }),
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch RFID events' }, { status: 500 })
  }
}
