import { Request, Response } from 'express';
import { DriverModel } from '../models/Driver';

export const getAvailableDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await DriverModel.find({
      status: 'AVAILABLE',
      licenseExpiryDate: {
        $gt: new Date()
      }
    });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (search) {
      where.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { licenseNumber: { $regex: String(search), $options: 'i' } }
      ];
    }
    const drivers = await DriverModel.find(where);
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const getExpiringLicenses = async (req: Request, res: Response) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const drivers = await DriverModel.find({
      licenseExpiryDate: {
        $lte: thirtyDaysFromNow
      },
      status: {
        $ne: 'SUSPENDED'
      }
    });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch expiring licenses' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const existing = await DriverModel.findOne({ licenseNumber: req.body.licenseNumber });
    if (existing) {
      return res.status(409).json({ message: 'License number already exists' });
    }
    const data = { ...req.body };
    if (data.licenseExpiryDate) {
      data.licenseExpiryDate = new Date(data.licenseExpiryDate);
    }
    const driver = await DriverModel.create(data);
    res.status(201).json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.licenseExpiryDate) {
      data.licenseExpiryDate = new Date(data.licenseExpiryDate);
    }
    const driver = await DriverModel.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driver = await DriverModel.findByIdAndUpdate(req.params.id, { status: 'SUSPENDED' }, { new: true });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to suspend driver' });
  }
};
