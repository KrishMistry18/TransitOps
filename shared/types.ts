// TransitOps — canonical shared types (single source of truth for the integrated app).
// Role model reconciled to requirements.md: DRIVER (Driver_Role), not DISPATCHER.
// IDs are MongoDB ObjectId strings (Prisma + MongoDB).

export type Role = "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";

export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_SHOP" | "RETIRED";
export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
export type TripStatus = "DRAFT" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type MaintenanceStatus = "ACTIVE" | "CLOSED"; // ACTIVE == "Open" state in requirements.md wording
export type ExpenseType = "TOLL" | "MAINTENANCE" | "OTHER";
export type DisruptionType = "VEHICLE_BREAKDOWN" | "EMERGENCY_MAINTENANCE" | "DRIVER_UNAVAILABLE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  typeLabel: string;
  fileName: string;
  url: string;
  uploadedAt: Date | string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  model?: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  documents?: VehicleDocument[];
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
  sourceRegion?: string;
  destination: string;
  destinationRegion?: string;
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
  cancelledAt?: Date | string;
  disrupted?: boolean;
  atRisk?: boolean;
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
  impliedEfficiency?: number | null;
  anomalyFlag?: boolean;
  anomalyReason?: string | null;
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
  fuelPrice?: number;
  licenseReminderWindowDays?: number;
  emailRemindersEnabled?: boolean;
}

export interface RecoveryAudit {
  id: string;
  tripId: string;
  originalVehicleId?: string | null;
  originalDriverId?: string | null;
  replacementVehicleId: string;
  replacementDriverId: string;
  disruptionType: DisruptionType;
  timestamp: Date | string;
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
  maintenance: PermissionLevel;
}

export type PermissionsMatrix = Record<string, FeaturePermissions>;
