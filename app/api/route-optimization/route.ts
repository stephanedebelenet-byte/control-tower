import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Route optimization using nearest-neighbor heuristic
 * For production: implement Vroom, OSRM, or Google Maps API
 */

interface RoutePoint {
  id: string
  latitude: number
  longitude: number
  type: 'pickup' | 'delivery'
  taskId: string
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function optimizeRoute(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= 2) return points

  // Nearest-neighbor algorithm
  const route: RoutePoint[] = [points[0]]
  const remaining = new Set(points.slice(1))

  while (remaining.size > 0) {
    const current = route[route.length - 1]
    let nearest = null
    let minDistance = Infinity

    for (const point of remaining) {
      const distance = calculateDistance(
        current.latitude,
        current.longitude,
        point.latitude,
        point.longitude
      )
      if (distance < minDistance) {
        minDistance = distance
        nearest = point
      }
    }

    if (nearest) {
      route.push(nearest)
      remaining.delete(nearest)
    }
  }

  return route
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await verifyToken(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { vehicleId, taskIds } = body

    if (!vehicleId || !taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch delivery tasks with locations
    const tasks = await prisma.deliveryTask.findMany({
      where: {
        id: { in: taskIds },
        organizationId: user.organizationId,
      },
    })

    if (tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks found' }, { status: 404 })
    }

    // Get vehicle location (latest GPS)
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle || vehicle.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Build route points
    const points: RoutePoint[] = tasks.map((task) => ({
      id: task.id,
      latitude: task.latitude || 0,
      longitude: task.longitude || 0,
      type: 'delivery',
      taskId: task.id,
    }))

    // Optimize route
    const optimizedRoute = optimizeRoute(points)

    // Calculate total distance
    let totalDistance = 0
    for (let i = 0; i < optimizedRoute.length - 1; i++) {
      totalDistance += calculateDistance(
        optimizedRoute[i].latitude,
        optimizedRoute[i].longitude,
        optimizedRoute[i + 1].latitude,
        optimizedRoute[i + 1].longitude
      )
    }

    return NextResponse.json({
      vehicleId,
      optimizedSequence: optimizedRoute.map((p) => p.taskId),
      totalDistance: totalDistance.toFixed(2),
      estimatedTime: Math.ceil(totalDistance / 80 * 60), // minutes at 80 km/h avg
      points: optimizedRoute,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to optimize route' }, { status: 500 })
  }
}
