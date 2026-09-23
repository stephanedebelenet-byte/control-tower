import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tank = await prisma.fuelTank.findUnique({
      where: { id: params.id },
    })

    if (!tank || tank.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(tank)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch fuel tank' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { currentLevel, location, fuelType } = body

    const existing = await prisma.fuelTank.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const tank = await prisma.fuelTank.update({
      where: { id: params.id },
      data: {
        currentLevel: currentLevel !== undefined ? currentLevel : undefined,
        location: location || undefined,
        fuelType: fuelType || undefined,
      },
    })

    return NextResponse.json(tank)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update fuel tank' }, { status: 500 })
  }
}
