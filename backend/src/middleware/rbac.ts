import { Request, Response, NextFunction } from 'express';
import { Role, FeaturePermissions } from '@shared/types';
import { PERMISSIONS } from '../config/permissions';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      // Req 2.3 — exact denial message
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    next();
  };
};

/**
 * Guard a route by feature + minimum permission level, derived from the RBAC matrix.
 * level 'view' allows roles with 'view' or 'full'; level 'full' allows only 'full'.
 */
export const requireFeature = (feature: keyof FeaturePermissions, level: 'view' | 'full') => {
  const allowed = (Object.entries(PERMISSIONS) as [Role, FeaturePermissions][])
    .filter(([, perms]) => (level === 'view' ? perms[feature] !== 'none' : perms[feature] === 'full'))
    .map(([role]) => role);
  return requireRole(...allowed);
};
