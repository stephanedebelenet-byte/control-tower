import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * LoRaWAN Sensor Integration
 * Remote fuel tank monitoring via LoRa devices
 * Device sends: deviceId, fuelLevel, temperature, battery, signal
 */

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      deviceId,
      fuelTankId,
      fuelLevel,
      temperature,
      batteryLevel,
      signalStrength,
      timestamp,
    } = body

    if (!deviceId || !fuelTankId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tank = await prisma.fuelTank.findUnique({
      where: { id: fuelTankId },
    })

    if (!tank || tank.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Fuel tank not found' }, { status: 404 })
    }

    // Update tank level if sensor reading valid
    if (fuelLevel !== undefined && fuelLevel >= 0 && fuelLevel <= tank.capacity) {
      await prisma.fuelTank.update({
        where: { id: fuelTankId },
        data: { currentLevel: fuelLevel },
      })
    }

    // Log sensor reading for historical tracking
    const reading = await prisma.fuelTank.update({
      where: { id: fuelTankId },
      data: {
        metadata: {
          lastSensorReading: {
            timestamp: timestamp || new Date(),
            fuelLevel,
            temperature,
            batteryLevel,
            signalStrength,
            deviceId,
          },
        },
      },
    })

    // Alert if tank low
    if (fuelLevel && fuelLevel < tank.capacity * 0.2) {
      await prisma.systemAlert.create({
        data: {
          code: `FUEL_LOW_${fuelTankId}`,
          description: `Fuel tank ${tank.location} level low: ${fuelLevel}/${tank.capacity}L`,
          severity: 'warning',
          resolved: false,
          vehicleId: null,
        },
      })
    }

    // Alert if sensor battery low
    if (batteryLevel && batteryLevel < 20) {
      await prisma.systemAlert.create({
        data: {
          code: `SENSOR_BATTERY_${deviceId}`,
          description: `LoRaWAN sensor ${deviceId} battery low: ${batteryLevel}%`,
          severity: 'warning',
          resolved: false,
          vehicleId: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      tankId: fuelTankId,
      fuelLevel,
      tankCapacity: tank.capacity,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to ingest sensor data' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all fuel tanks with sensor status
    const tanks = await prisma.fuelTank.findMany({
      where: { organizationId: user.organizationId },
    })

    return NextResponse.json(
      tanks.map((t) => ({
        id: t.id,
        location: t.location,
        capacity: t.capacity,
        currentLevel: t.currentLevel,
        lastUpdate: t.metadata?.lastSensorReading?.timestamp,
        deviceId: t.metadata?.lastSensorReading?.deviceId,
        battery: t.metadata?.lastSensorReading?.batteryLevel,
        signal: t.metadata?.lastSensorReading?.signalStrength,
      }))
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch sensor data' }, { status: 500 })
  }
}
