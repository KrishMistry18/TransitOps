import { PermissionsMatrix } from '@shared/types';

export const PERMISSIONS: PermissionsMatrix = {
  FLEET_MANAGER: {
    fleet: "full",
    drivers: "view",
    trips: "view",
    fuelExp: "view",
    analytics: "full"
  },
  DISPATCHER: {
    fleet: "view",
    drivers: "full",
    trips: "full",
    fuelExp: "none",
    analytics: "none"
  },
  SAFETY_OFFICER: {
    fleet: "view",
    drivers: "view",
    trips: "view",
    fuelExp: "none",
    analytics: "view"
  },
  FINANCIAL_ANALYST: {
    fleet: "none",
    drivers: "none",
    trips: "view",
    fuelExp: "full",
    analytics: "full"
  }
};
