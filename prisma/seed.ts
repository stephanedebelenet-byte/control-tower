import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Mojazine Demo',
      slug: 'mojazine-demo',
      description: 'Demo organization for testing',
    },
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('demo123456', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@mojazine.ma',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      organizationId: org.id,
    },
  })

  // Create warehouses
  const warehouses = await Promise.all([
    prisma.warehouseLocation.create({
      data: {
        organizationId: org.id,
        name: 'Tangier Med',
        type: 'depot',
        latitude: 35.9425,
        longitude: -5.3211,
        capacity: 5000,
      },
    }),
    prisma.warehouseLocation.create({
      data: {
        organizationId: org.id,
        name: 'Jorf Lasfar',
        type: 'port',
        latitude: 33.2639,
        longitude: -8.6328,
        capacity: 8000,
      },
    }),
    prisma.warehouseLocation.create({
      data: {
        organizationId: org.id,
        name: 'Agadir',
        type: 'warehouse',
        latitude: 30.4278,
        longitude: -9.5981,
        capacity: 4000,
      },
    }),
  ])

  // Create initial inventory
  for (const warehouse of warehouses) {
    await prisma.inventoryItem.create({
      data: {
        warehouseId: warehouse.id,
        productType: 'Ciment',
        quantity: 500,
        unit: 'tons',
        reorderLevel: 100,
      },
    })
    await prisma.inventoryItem.create({
      data: {
        warehouseId: warehouse.id,
        productType: 'Sable',
        quantity: 800,
        unit: 'tons',
        reorderLevel: 150,
      },
    })
  }

  // Create 10 demo vehicles
  for (let i = 0; i < 10; i++) {
    await prisma.vehicle.create({
      data: {
        organizationId: org.id,
        plateNumber: `TMS-${1000 + i}`,
        registrationDate: new Date(),
        capacity: 12,
        status: Math.random() > 0.2 ? 'active' : 'idle',
      },
    })
  }

  // Create 5 drivers
  for (let i = 0; i < 5; i++) {
    await prisma.driver.create({
      data: {
        organizationId: org.id,
        name: ['Ahmed', 'Youssef', 'Fatima', 'Hassan', 'Zahra'][i],
        licenseNumber: `MA-${100 + i}`,
        status: 'active',
      },
    })
  }

  // Create fuel tanks
  for (const name of ['Tangier', 'Jorf', 'Agadir']) {
    await prisma.fuelTank.create({
      data: {
        organizationId: org.id,
        location: name,
        capacity: 10000,
        currentLevel: Math.random() * 10000,
      },
    })
  }

  // Get vehicles and drivers for deliveries
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: org.id },
    take: 5,
  })
  const drivers = await prisma.driver.findMany({
    where: { organizationId: org.id },
    take: 3,
  })

  // Create demo deliveries
  const deliveryStatuses = ['pending', 'in_progress', 'completed']
  for (let i = 0; i < 8; i++) {
    const status =
      deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)]
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
    const driver = drivers[Math.floor(Math.random() * drivers.length)]

    await prisma.deliveryTask.create({
      data: {
        organizationId: org.id,
        vehicleId: vehicle.id,
        driverId: driver.id,
        warehouseId: warehouse.id,
        targetLocation: [
          'Casablanca',
          'Rabat',
          'Fes',
          'Marrakech',
          'Tangier',
        ][Math.floor(Math.random() * 5)],
        productType: ['Ciment', 'Sable', 'Agrégats'][Math.floor(Math.random() * 3)],
        quantity: Math.floor(Math.random() * 10) + 5,
        status: status as any,
        notes: 'Demo delivery task',
        lines: {
          create: [
            {
              lineNumber: 1,
              productType: ['Ciment', 'Sable', 'Agrégats'][
                Math.floor(Math.random() * 3)
              ],
              quantity: Math.floor(Math.random() * 10) + 5,
              unit: 'tons',
            },
          ],
        },
      },
    })
  }

  // Create demo maintenance tasks
  const maintenanceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Inspection',
    'Filter Replacement',
    'Engine Service',
  ]
  for (let i = 0; i < 5; i++) {
    const vehicle = vehicles[i % vehicles.length]
    const daysFromNow = Math.floor(Math.random() * 60) - 15 // -15 to +45 days
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow)

    const maintenanceStatus =
      daysFromNow < -5 ? 'scheduled' :
      daysFromNow < 0 ? 'in_progress' :
      'scheduled'

    const task = await prisma.maintenanceTask.create({
      data: {
        vehicleId: vehicle.id,
        taskType: maintenanceTypes[i % maintenanceTypes.length],
        description: 'Regular maintenance',
        scheduledDate,
        estimatedCost: Math.floor(Math.random() * 500) + 100,
        status: maintenanceStatus as any,
        notes: 'Demo maintenance task',
      },
    })

    // Add spare parts
    const partNames = ['Oil Filter', 'Air Filter', 'Brake Pads', 'Tire', 'Spark Plug']
    for (let j = 0; j < Math.floor(Math.random() * 2) + 1; j++) {
      await prisma.sparePart.create({
        data: {
          maintenanceTaskId: task.id,
          partName: partNames[Math.floor(Math.random() * partNames.length)],
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: Math.floor(Math.random() * 150) + 20,
        },
      })
    }
  }

  // Create demo eco-scores
  for (const vehicle of vehicles) {
    for (let day = 0; day < 30; day++) {
      const date = new Date()
      date.setDate(date.getDate() - day)

      const score = Math.floor(Math.random() * 40) + 60 // 60-100 score

      await prisma.dailyEcoScore.create({
        data: {
          vehicleId: vehicle.id,
          date,
          score,
          speedConsistency: Math.random() * 40 + 60,
          accelerationSmootness: Math.random() * 40 + 60,
          brakingEfficiency: Math.random() * 40 + 60,
          fuelEfficiency: Math.random() * 40 + 60,
          rpmManagement: Math.random() * 40 + 60,
        },
      })
    }
  }

  // Create demo CAN telemetry data
  for (const vehicle of vehicles) {
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date()
      timestamp.setHours(timestamp.getHours() - hour)

      await prisma.vehicleTelemetry.create({
        data: {
          vehicleId: vehicle.id,
          speed: Math.floor(Math.random() * 120),
          rpm: Math.floor(Math.random() * 4000) + 800,
          engineTemp: Math.floor(Math.random() * 30) + 85,
          coolantTemp: Math.floor(Math.random() * 20) + 90,
          oilPressure: Math.floor(Math.random() * 40) + 30,
          fuelRate: Math.random() * 0.1 + 0.02,
          acceleratorPedalPos: Math.random() * 100,
          brakePedalPos: Math.random() * 80,
          throttlePos: Math.random() * 100,
          gearPosition: ['P', 'R', 'N', 'D'][Math.floor(Math.random() * 4)],
          odometer: Math.floor(Math.random() * 150000) + 50000,
          voltage: 14 + Math.random() * 2,
          amperage: Math.random() * 100 - 50,
          batteryHealth: Math.floor(Math.random() * 40) + 60,
          tirePressures: {
            fl: 32 + Math.random() * 4,
            fr: 32 + Math.random() * 4,
            rl: 32 + Math.random() * 4,
            rr: 32 + Math.random() * 4,
          },
          absActive: Math.random() > 0.8,
          tcActive: Math.random() > 0.7,
          timestamp,
        },
      })
    }
  }

  // Create demo fault codes
  const faultCodes = [
    { dtc: 'P0101', desc: 'Mass or Volume Air Flow Circuit' },
    { dtc: 'P0300', desc: 'Random/Multiple Cylinder Misfire Detected' },
    { dtc: 'P0400', desc: 'Exhaust Gas Recirculation Flow' },
    { dtc: 'P0420', desc: 'Catalyst System Efficiency' },
    { dtc: 'P0500', desc: 'Vehicle Speed Sensor' },
    { dtc: 'P1000', desc: 'OBD System Readiness' },
  ]

  for (let i = 0; i < 8; i++) {
    const vehicle = vehicles[i % vehicles.length]
    const faultCode = faultCodes[Math.floor(Math.random() * faultCodes.length)]
    const severity = Math.random() > 0.6 ? 'critical' : 'warning'

    await prisma.systemAlert.create({
      data: {
        vehicleId: vehicle.id,
        code: faultCode.dtc,
        description: faultCode.desc,
        severity: severity as any,
        resolved: Math.random() > 0.7,
        acknowledged: Math.random() > 0.5,
      },
    })
  }

  // Create demo harsh events
  const eventTypes = ['harsh_braking', 'harsh_acceleration', 'speeding', 'sharp_turn']
  for (let i = 0; i < 15; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const severity = Math.random() > 0.7 ? 'critical' : 'warning'

    await prisma.vehicleAlert.create({
      data: {
        vehicleId: vehicle.id,
        type: eventType as any,
        severity: severity as any,
        message: `${eventType} detected`,
        resolved: Math.random() > 0.5,
      },
    })
  }

  console.log('✓ Database seeded successfully')
  console.log('✓ Organization:', org.slug)
  console.log('✓ Admin user:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
