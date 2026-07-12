const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'fleet@transitops.com' },
      update: {},
      create: {
        email: 'fleet@transitops.com',
        name: 'Fleet Manager',
        passwordHash,
        role: 'FLEET_MANAGER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dispatcher@transitops.com' },
      update: {},
      create: {
        email: 'dispatcher@transitops.com',
        name: 'Dispatcher',
        passwordHash,
        role: 'DISPATCHER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'safety@transitops.com' },
      update: {},
      create: {
        email: 'safety@transitops.com',
        name: 'Safety Officer',
        passwordHash,
        role: 'SAFETY_OFFICER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@transitops.com' },
      update: {},
      create: {
        email: 'finance@transitops.com',
        name: 'Financial Analyst',
        passwordHash,
        role: 'FINANCIAL_ANALYST',
      },
    }),
  ]);
  
  // Settings
  await prisma.depotSettings.create({
    data: {
      depotName: 'Central Depot',
      currency: 'USD',
      distanceUnit: 'km'
    }
  });

  // Drivers
  const driverStatuses = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED', 'AVAILABLE'];
  const drivers = [];
  for (let i = 0; i < 5; i++) {
    const driver = await prisma.driver.create({
      data: {
        name: `Driver ${i + 1}`,
        licenseNumber: `LIC${1000 + i}`,
        licenseCategory: i % 2 === 0 ? 'CDL-A' : 'CDL-B',
        licenseExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * (i === 3 ? -1 : 1)), // One expired
        contactNumber: `555-010${i}`,
        status: driverStatuses[i],
        safetyScore: 90 + i
      }
    });
    drivers.push(driver);
  }

  // Vehicles
  const vehicleStatuses = ['AVAILABLE', 'AVAILABLE', 'ON_TRIP', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
  const vehicles = [];
  for (let i = 0; i < 6; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: `TRK-${2000 + i}`,
        name: `Truck ${i + 1}`,
        type: i % 2 === 0 ? 'Heavy Duty' : 'Light Duty',
        maxLoadCapacity: 10000 + i * 1000,
        odometer: 50000 + i * 5000,
        acquisitionCost: 80000,
        status: vehicleStatuses[i],
        region: 'North',
      }
    });
    vehicles.push(vehicle);
  }

  // Trips
  for (let i = 0; i < 5; i++) {
    const trip = await prisma.trip.create({
      data: {
        source: `City ${i}`,
        destination: `City ${i + 1}`,
        cargoWeight: 5000,
        plannedDistance: 500,
        actualDistance: 520,
        fuelConsumed: 100,
        revenue: 1500,
        status: 'COMPLETED',
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        vehicleId: vehicles[i].id,
        driverId: drivers[i].id,
      }
    });

    // FuelLog for trip
    await prisma.fuelLog.create({
      data: {
        liters: 100,
        cost: 300,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        vehicleId: vehicles[i].id,
        tripId: trip.id
      }
    });
  }

  // Maintenance & Expenses
  await prisma.maintenanceLog.create({
    data: {
      description: 'Regular Oil Change',
      cost: 500,
      status: 'CLOSED',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
      vehicleId: vehicles[4].id
    }
  });

  await prisma.expense.create({
    data: {
      type: 'TOLL',
      amount: 50,
      description: 'Highway Toll',
      date: new Date(),
      vehicleId: vehicles[0].id
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
