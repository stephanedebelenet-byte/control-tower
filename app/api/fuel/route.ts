import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fuelTanks = await prisma.fuelTank.findMany({
      where: { organizationId: user.organizationId },
    })

    return NextResponse.json(fuelTanks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch fuel tanks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { location, capacity, currentLevel, fuelType } = body

    if (!location || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tank = await prisma.fuelTank.create({
      data: {
        organizationId: user.organizationId,
        location,
        capacity,
        currentLevel: currentLevel || 0,
        fuelType: fuelType || 'diesel',
      },
    })

    return NextResponse.json(tank, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create fuel tank' }, { status: 500 })
  }
}
