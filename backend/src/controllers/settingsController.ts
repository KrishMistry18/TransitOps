import { Request, Response } from 'express';
import { DepotSettingsModel } from '../models/DepotSettings';
import { PERMISSIONS } from '../config/permissions';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await DepotSettingsModel.findOne();
    if (!settings) {
      settings = await DepotSettingsModel.create({
        depotName: 'TransitOps Default', currency: 'USD', distanceUnit: 'km'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { depotName, currency, distanceUnit } = req.body;
  try {
    const settings = await DepotSettingsModel.findOne();
    if (settings) {
      settings.depotName = depotName;
      settings.currency = currency;
      settings.distanceUnit = distanceUnit;
      await settings.save();
      res.json(settings);
    } else {
      res.status(404).json({ message: 'Settings not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPermissions = (req: Request, res: Response) => {
  res.json(PERMISSIONS);
};
