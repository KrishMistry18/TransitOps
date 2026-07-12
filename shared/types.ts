export type Role = "FLEET_MANAGER" | "DISPATCHER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "ACTIVE" | "CLOSED";
export type ExpenseType = "TOLL" | "MAINTENANCE" | "OTHER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
}

export interface Vehicle {
  id: string;
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
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: Date | string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
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
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  startDate: Date | string;
  endDate?: Date | string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId?: string | null;
  liters: number;
  cost: number;
  date: Date | string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: Date | string;
}

export interface DepotSettings {
  id?: string;
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
  id?: string;
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
