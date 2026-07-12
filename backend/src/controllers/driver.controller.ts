import { Request, Response } from 'express';
import { db } from '../config/dbService';

export const getAvailableDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = db.getDrivers().filter(d => 
      d.status === 'AVAILABLE' && new Date(d.licenseExpiryDate) > new Date()
    );
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};
