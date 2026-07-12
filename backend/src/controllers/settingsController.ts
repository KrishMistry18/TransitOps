import { Request, Response } from 'express';
import { db } from '../config/dbService';
import { PERMISSIONS } from '../config/permissions';

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { depotName, currency, distanceUnit } = req.body;
  try {
    const updated = db.updateSettings({ depotName, currency, distanceUnit });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPermissions = (req: Request, res: Response) => {
  res.json(PERMISSIONS);
};
