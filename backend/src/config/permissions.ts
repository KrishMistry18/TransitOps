import { PermissionsMatrix } from '@shared/types';

// Reconciled RBAC matrix aligned to requirements.md 2.4–2.7.
// - Fleet_Manager: write vehicles + maintenance (2.6)
// - Driver_Role: create/dispatch trips (2.7)
// - Safety_Officer: write driver compliance; read trips + vehicles (2.5)
// - Financial_Analyst: read reports/expenses/analytics; no write to vehicles/drivers/trips (2.4)
export const PERMISSIONS: PermissionsMatrix = {
  FLEET_MANAGER: {
    fleet: "full",
    drivers: "view",
    trips: "view",
    fuelExp: "view",
    analytics: "full",
    maintenance: "full"
  },
  DRIVER: {
    fleet: "view",
    drivers: "view",
    trips: "full",
    fuelExp: "none",
    analytics: "none",
    maintenance: "view"
  },
  SAFETY_OFFICER: {
    fleet: "view",
    drivers: "full",
    trips: "view",
    fuelExp: "none",
    analytics: "view",
    maintenance: "view"
  },
  FINANCIAL_ANALYST: {
    fleet: "none",
    drivers: "none",
    trips: "view",
    fuelExp: "full",
    analytics: "full",
    maintenance: "view"
  }
};
