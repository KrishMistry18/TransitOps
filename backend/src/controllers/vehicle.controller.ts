import { Request, Response } from 'express';
import { db } from '../config/dbService';

export const getAvailableVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles().filter(v => v.status === 'AVAILABLE');
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available vehicles' });
  }
};
