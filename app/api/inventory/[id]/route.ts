import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: {
        warehouse: true,
      },
    })

    if (!item || item.warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch inventory item' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { quantity, reorderLevel, notes } = body

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: { warehouse: true },
    })

    if (!existing || existing.warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        quantity: quantity !== undefined ? quantity : undefined,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
      include: { warehouse: true },
    })

    if (!existing || existing.warehouse.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.inventoryItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
  }
}
