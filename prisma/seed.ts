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
