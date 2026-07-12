export type Role = "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "ACTIVE" | "CLOSED";
export type ExpenseType = "TOLL" | "MAINTENANCE" | "OTHER";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
}

export interface Vehicle {
  id: number;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
}

export interface Driver {
  id: number;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date | string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: number;
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance?: number;
  fuelConsumed?: number;
  revenue?: number;
  status: TripStatus;
  dispatchedAt?: Date | string;
  completedAt?: Date | string;
}

export interface MaintenanceLog {
  id: number;
  vehicleId: number;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  startDate: Date | string;
  endDate?: Date | string;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  tripId?: number | null;
  liters: number;
  cost: number;
  date: Date | string;
}

export interface Expense {
  id: number;
  vehicleId: number;
  type: ExpenseType;
  amount: number;
  description: string;
  date: Date | string;
}

export interface DepotSettings {
  id?: number;
  depotName: string;
  currency: string;
  distanceUnit: string;
}

export interface DashboardKPIs {
  activeVehicles: number;
  driversOnTrip: number;
  totalTripsToday: number;
  maintenanceAlerts: number;
  fuelCostToday: number;
  revenueToday: number;
  utilizationRate: number;
}

export interface VehicleReportRow {
  region?: string;
  count?: number;
  month?: string;
  rate?: number;
  id?: number;
  registrationNumber?: string;
  status?: string;
  fuelEfficiency?: number;
  cost?: number;
  roi?: number;
}

export type PermissionLevel = "full" | "view" | "none";

export interface FeaturePermissions {
  fleet: PermissionLevel;
  drivers: PermissionLevel;
  trips: PermissionLevel;
  fuelExp: PermissionLevel;
  analytics: PermissionLevel;
}

export type PermissionsMatrix = Record<string, FeaturePermissions>;
