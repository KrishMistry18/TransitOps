import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, DepotSettings } from '@shared/types';

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  settings: DepotSettings[];
}

class JsonDb {
  private data!: Schema;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        return;
      } catch (err) {
        console.error('Failed to parse database file, re-initializing...', err);
      }
    }

    this.resetToSeed();
  }

  public resetToSeed() {
    console.log('Seeding local mock JSON database...');
    const passwordHash = bcrypt.hashSync('password123', 10);

    const users: User[] = [
      {
        id: 1,
        email: 'fleet@transitops.com',
        name: 'Fleet Manager',
        role: 'FLEET_MANAGER',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      {
        id: 2,
        email: 'dispatcher@transitops.com',
        name: 'Dispatcher',
        role: 'DISPATCHER',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      {
        id: 3,
        email: 'safety@transitops.com',
        name: 'Safety Officer',
        role: 'SAFETY_OFFICER',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      {
        id: 4,
        email: 'finance@transitops.com',
        name: 'Financial Analyst',
        role: 'FINANCIAL_ANALYST',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    ].map(u => ({ ...u, passwordHash } as any)); // inject passwordHash privately

    const settings: DepotSettings[] = [
      {
        id: 1,
        depotName: 'Central Depot',
        currency: 'USD',
        distanceUnit: 'km',
      },
    ];

    const drivers: Driver[] = [];
    const driverStatuses: Array<'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'> = [
      'AVAILABLE',
      'ON_TRIP',
      'OFF_DUTY',
      'SUSPENDED',
      'AVAILABLE',
    ];
    for (let i = 0; i < 5; i++) {
      drivers.push({
        id: i + 1,
        name: `Driver ${i + 1}`,
        licenseNumber: `LIC${1000 + i}`,
        licenseCategory: i % 2 === 0 ? 'CDL-A' : 'CDL-B',
        licenseExpiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * (i === 3 ? -1 : 1)).toISOString(),
        contactNumber: `555-010${i}`,
        status: driverStatuses[i],
        safetyScore: 90 + i,
      });
    }

    const vehicles: Vehicle[] = [];
    const vehicleStatuses: Array<'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'> = [
      'AVAILABLE',
      'AVAILABLE',
      'ON_TRIP',
      'ON_TRIP',
      'IN_SHOP',
      'RETIRED',
    ];
    for (let i = 0; i < 6; i++) {
      vehicles.push({
        id: i + 1,
        registrationNumber: `TRK-${2000 + i}`,
        name: `Truck ${i + 1}`,
        type: i % 2 === 0 ? 'Heavy Duty' : 'Light Duty',
        maxLoadCapacity: 10000 + i * 1000,
        odometer: 50000 + i * 5000,
        acquisitionCost: 80000,
        status: vehicleStatuses[i],
        region: 'North',
      });
    }

    const trips: Trip[] = [];
    const fuelLogs: FuelLog[] = [];

    for (let i = 0; i < 5; i++) {
      const tripId = i + 1;
      trips.push({
        id: tripId,
        source: `City ${i}`,
        destination: `City ${i + 1}`,
        cargoWeight: 5000,
        plannedDistance: 500,
        actualDistance: 520,
        fuelConsumed: 100,
        revenue: 1500,
        status: 'COMPLETED',
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        vehicleId: vehicles[i].id,
        driverId: drivers[i].id,
      });

      fuelLogs.push({
        id: i + 1,
        liters: 100,
        cost: 300,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        vehicleId: vehicles[i].id,
        tripId: tripId,
      });
    }

    const maintenanceLogs: MaintenanceLog[] = [
      {
        id: 1,
        description: 'Regular Oil Change',
        cost: 500,
        status: 'CLOSED',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        vehicleId: vehicles[4].id,
      },
    ];

    const expenses: Expense[] = [
      {
        id: 1,
        type: 'TOLL',
        amount: 50,
        description: 'Highway Toll',
        date: new Date().toISOString(),
        vehicleId: vehicles[0].id,
      },
    ];

    this.data = {
      users,
      vehicles,
      drivers,
      trips,
      maintenanceLogs,
      fuelLogs,
      expenses,
      settings,
    };

    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public updateUser(id: number, updates: Partial<User>) {
    this.data.users = this.data.users.map(u => (u.id === id ? { ...u, ...updates } : u));
    this.save();
  }

  public getVehicles(): Vehicle[] {
    return this.data.vehicles;
  }

  public insertVehicle(vehicle: Omit<Vehicle, 'id'>): Vehicle {
    const id = this.data.vehicles.reduce((max, v) => (v.id > max ? v.id : max), 0) + 1;
    const newVehicle = { id, ...vehicle };
    this.data.vehicles.push(newVehicle);
    this.save();
    return newVehicle;
  }

  public updateVehicle(id: number, updates: Partial<Vehicle>): Vehicle | null {
    const idx = this.data.vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.data.vehicles[idx] = { ...this.data.vehicles[idx], ...updates };
    this.save();
    return this.data.vehicles[idx];
  }

  public deleteVehicle(id: number): boolean {
    const initialLen = this.data.vehicles.length;
    this.data.vehicles = this.data.vehicles.filter(v => v.id !== id);
    this.save();
    return this.data.vehicles.length < initialLen;
  }

  public getDrivers(): Driver[] {
    return this.data.drivers;
  }

  public insertDriver(driver: Omit<Driver, 'id'>): Driver {
    const id = this.data.drivers.reduce((max, d) => (d.id > max ? d.id : max), 0) + 1;
    const newDriver = { id, ...driver };
    this.data.drivers.push(newDriver);
    this.save();
    return newDriver;
  }

  public updateDriver(id: number, updates: Partial<Driver>): Driver | null {
    const idx = this.data.drivers.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.data.drivers[idx] = { ...this.data.drivers[idx], ...updates };
    this.save();
    return this.data.drivers[idx];
  }

  public deleteDriver(id: number): boolean {
    const initialLen = this.data.drivers.length;
    this.data.drivers = this.data.drivers.filter(d => d.id !== id);
    this.save();
    return this.data.drivers.length < initialLen;
  }

  public getTrips(): Trip[] {
    return this.data.trips;
  }

  public insertTrip(trip: Omit<Trip, 'id'>): Trip {
    const id = this.data.trips.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1;
    const newTrip = { id, ...trip };
    this.data.trips.push(newTrip);
    this.save();
    return newTrip;
  }

  public updateTrip(id: number, updates: Partial<Trip>): Trip | null {
    const idx = this.data.trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.trips[idx] = { ...this.data.trips[idx], ...updates };
    this.save();
    return this.data.trips[idx];
  }

  public getMaintenanceLogs(): MaintenanceLog[] {
    return this.data.maintenanceLogs;
  }

  public insertMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): MaintenanceLog {
    const id = this.data.maintenanceLogs.reduce((max, m) => (m.id > max ? m.id : max), 0) + 1;
    const newLog = { id, ...log };
    this.data.maintenanceLogs.push(newLog);
    this.save();
    return newLog;
  }

  public updateMaintenanceLog(id: number, updates: Partial<MaintenanceLog>): MaintenanceLog | null {
    const idx = this.data.maintenanceLogs.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.maintenanceLogs[idx] = { ...this.data.maintenanceLogs[idx], ...updates };
    this.save();
    return this.data.maintenanceLogs[idx];
  }

  public getFuelLogs(): FuelLog[] {
    return this.data.fuelLogs;
  }

  public insertFuelLog(log: Omit<FuelLog, 'id'>): FuelLog {
    const id = this.data.fuelLogs.reduce((max, f) => (f.id > max ? f.id : max), 0) + 1;
    const newLog = { id, ...log };
    this.data.fuelLogs.push(newLog);
    this.save();
    return newLog;
  }

  public getExpenses(): Expense[] {
    return this.data.expenses;
  }

  public insertExpense(expense: Omit<Expense, 'id'>): Expense {
    const id = this.data.expenses.reduce((max, e) => (e.id > max ? e.id : max), 0) + 1;
    const newExpense = { id, ...expense };
    this.data.expenses.push(newExpense);
    this.save();
    return newExpense;
  }

  public getSettings(): DepotSettings {
    if (this.data.settings.length === 0) {
      this.data.settings.push({ id: 1, depotName: 'TransitOps Default', currency: 'USD', distanceUnit: 'km' });
      this.save();
    }
    return this.data.settings[0];
  }

  public updateSettings(updates: Partial<DepotSettings>): DepotSettings {
    const settings = this.getSettings();
    this.data.settings[0] = { ...settings, ...updates };
    this.save();
    return this.data.settings[0];
  }
}

export const db = new JsonDb();
