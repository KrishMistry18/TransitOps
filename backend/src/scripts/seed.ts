import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { UserModel } from '../models/User';
import { VehicleModel } from '../models/Vehicle';
import { DriverModel } from '../models/Driver';
import { TripModel } from '../models/Trip';
import { FuelLogModel } from '../models/FuelLog';
import { MaintenanceLogModel } from '../models/MaintenanceLog';
import { ExpenseModel } from '../models/Expense';
import { DepotSettingsModel } from '../models/DepotSettings';

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in env');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding');

  // Clear DB
  await UserModel.deleteMany({});
  await VehicleModel.deleteMany({});
  await DriverModel.deleteMany({});
  await TripModel.deleteMany({});
  await FuelLogModel.deleteMany({});
  await MaintenanceLogModel.deleteMany({});
  await ExpenseModel.deleteMany({});
  await DepotSettingsModel.deleteMany({});
  console.log('Database cleared');

  // 1. Create Users
  const users = await UserModel.create([
    {
      email: 'fleet@transitops.com',
      passwordHash: 'password123',
      name: 'Fleet Manager',
      role: 'FLEET_MANAGER'
    },
    {
      email: 'dispatcher@transitops.com',
      passwordHash: 'password123',
      name: 'Dispatcher User',
      role: 'DISPATCHER'
    },
    {
      email: 'safety@transitops.com',
      passwordHash: 'password123',
      name: 'Safety Officer',
      role: 'SAFETY_OFFICER'
    },
    {
      email: 'finance@transitops.com',
      passwordHash: 'password123',
      name: 'Financial Analyst',
      role: 'FINANCIAL_ANALYST'
    }
  ]);
  console.log('4 Users created successfully');

  // 2. Create Vehicles
  const vehicles = await VehicleModel.create([
    { registrationNumber: 'TRK-2000', name: 'Truck 1', type: 'Heavy Duty', maxLoadCapacity: 10000, odometer: 50000, acquisitionCost: 80000, status: 'AVAILABLE', region: 'North' },
    { registrationNumber: 'TRK-2001', name: 'Truck 2', type: 'Light Duty', maxLoadCapacity: 5000, odometer: 60000, acquisitionCost: 40000, status: 'ON_TRIP', region: 'South' },
    { registrationNumber: 'TRK-2002', name: 'Truck 3', type: 'Heavy Duty', maxLoadCapacity: 12000, odometer: 70000, acquisitionCost: 90000, status: 'IN_SHOP', region: 'East' },
    { registrationNumber: 'TRK-2003', name: 'Truck 4', type: 'Light Duty', maxLoadCapacity: 5500, odometer: 150000, acquisitionCost: 45000, status: 'RETIRED', region: 'West' },
    { registrationNumber: 'TRK-2004', name: 'Truck 5', type: 'Medium Duty', maxLoadCapacity: 8000, odometer: 30000, acquisitionCost: 55000, status: 'AVAILABLE', region: 'North' },
    { registrationNumber: 'TRK-2005', name: 'Truck 6', type: 'Heavy Duty', maxLoadCapacity: 11000, odometer: 95000, acquisitionCost: 85000, status: 'ON_TRIP', region: 'North' }
  ]);
  console.log('6 Vehicles created successfully');

  // 3. Create Drivers
  const nextYear = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
  const lastYear = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);

  const drivers = await DriverModel.create([
    { name: 'Driver Available', licenseNumber: 'LIC1000', licenseCategory: 'CDL-A', licenseExpiryDate: nextYear, contactNumber: '555-0100', safetyScore: 95, status: 'AVAILABLE' },
    { name: 'Driver On Trip', licenseNumber: 'LIC1001', licenseCategory: 'CDL-B', licenseExpiryDate: nextYear, contactNumber: '555-0101', safetyScore: 90, status: 'ON_TRIP' },
    { name: 'Driver Off Duty', licenseNumber: 'LIC1002', licenseCategory: 'CDL-A', licenseExpiryDate: nextYear, contactNumber: '555-0102', safetyScore: 92, status: 'OFF_DUTY' },
    { name: 'Driver Suspended', licenseNumber: 'LIC1003', licenseCategory: 'CDL-B', licenseExpiryDate: nextYear, contactNumber: '555-0103', safetyScore: 60, status: 'SUSPENDED' },
    { name: 'Driver Expired License', licenseNumber: 'LIC1004', licenseCategory: 'CDL-A', licenseExpiryDate: lastYear, contactNumber: '555-0104', safetyScore: 88, status: 'AVAILABLE' }
  ]);
  console.log('5 Drivers created successfully (1 with expired license)');

  // 4. Create Trips (at least 5 completed trips with fuel logs attached)
  const tripsData = [
    { source: 'City A', destination: 'City B', cargoWeight: 5000, plannedDistance: 500, actualDistance: 510, fuelConsumed: 120, revenue: 1500, status: 'COMPLETED' as const, dispatchedAt: new Date(Date.now() - 5*24*60*60*1000), completedAt: new Date(Date.now() - 4*24*60*60*1000) },
    { source: 'City C', destination: 'City D', cargoWeight: 4000, plannedDistance: 300, actualDistance: 295, fuelConsumed: 80, revenue: 1000, status: 'COMPLETED' as const, dispatchedAt: new Date(Date.now() - 4*24*60*60*1000), completedAt: new Date(Date.now() - 3*24*60*60*1000) },
    { source: 'City E', destination: 'City F', cargoWeight: 6000, plannedDistance: 450, actualDistance: 450, fuelConsumed: 110, revenue: 1350, status: 'COMPLETED' as const, dispatchedAt: new Date(Date.now() - 3*24*60*60*1000), completedAt: new Date(Date.now() - 2*24*60*60*1000) },
    { source: 'City G', destination: 'City H', cargoWeight: 3000, plannedDistance: 200, actualDistance: 205, fuelConsumed: 55, revenue: 700, status: 'COMPLETED' as const, dispatchedAt: new Date(Date.now() - 2*24*60*60*1000), completedAt: new Date(Date.now() - 1*24*60*60*1000) },
    { source: 'City I', destination: 'City J', cargoWeight: 7500, plannedDistance: 600, actualDistance: 605, fuelConsumed: 150, revenue: 2000, status: 'COMPLETED' as const, dispatchedAt: new Date(Date.now() - 1*24*60*60*1000), completedAt: new Date() }
  ];

  const trips = [];
  for (let i = 0; i < tripsData.length; i++) {
    const trip = await TripModel.create({
      ...tripsData[i],
      vehicle: vehicles[i]._id,
      driver: drivers[i]._id,
      createdBy: users[1]._id // Dispatcher
    });
    trips.push(trip);

    // Attach fuel log to each completed trip
    await FuelLogModel.create({
      vehicle: vehicles[i]._id,
      trip: trip._id,
      liters: tripsData[i].fuelConsumed,
      cost: tripsData[i].fuelConsumed * 10, // 10 INR per liter
      date: tripsData[i].completedAt
    });
  }
  console.log('5 Completed Trips with attached Fuel Logs created successfully');

  // 5. Create Maintenance Logs (a few)
  await MaintenanceLogModel.create([
    {
      vehicle: vehicles[2]._id, // TRK-2002
      description: 'Scheduled engine service',
      cost: 5000,
      status: 'ACTIVE',
      startDate: new Date()
    },
    {
      vehicle: vehicles[0]._id, // TRK-2000
      description: 'Brake pad replacement',
      cost: 1500,
      status: 'CLOSED',
      startDate: new Date(Date.now() - 10*24*60*60*1000),
      endDate: new Date(Date.now() - 8*24*60*60*1000)
    }
  ]);
  console.log('2 Maintenance Logs created successfully');

  // 6. Create Depot Settings (singleton)
  await DepotSettingsModel.create({
    depotName: 'TransitOps Bangalore',
    currency: 'INR',
    distanceUnit: 'km'
  });
  console.log('Depot Settings initialized');

  console.log('Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
