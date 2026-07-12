export type TripErrorCode =
  | 'TRIP_NOT_FOUND'
  | 'TRIP_NOT_DRAFT'
  | 'TRIP_NOT_DISPATCHED'
  | 'VEHICLE_NOT_FOUND'
  | 'DRIVER_NOT_FOUND'
  | 'VEHICLE_UNAVAILABLE'
  | 'DRIVER_UNAVAILABLE'
  | 'LICENSE_EXPIRED'
  | 'CARGO_EXCEEDS_CAPACITY'
  | 'VEHICLE_RACE_CONDITION'
  | 'DRIVER_RACE_CONDITION'
  | 'MISSING_COMPLETION_DATA'
  | 'INVALID_TRANSITION';

export interface ValidationResult {
  ok: boolean;
  errorCode?: TripErrorCode;
  message?: string;
  details?: Record<string, unknown>;
}

export interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
}

export interface CompleteTripInput {
  actualDistance: number;
  fuelConsumed: number;
  fuelCost?: number; 
}