const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS } = require('../config/permissions');

const prisma = new PrismaClient();

const getSettings = async (req, res) => {
  try {
    let settings = await prisma.depotSettings.findFirst();
    if (!settings) {
      settings = await prisma.depotSettings.create({
        data: { depotName: 'TransitOps Default', currency: 'USD', distanceUnit: 'km' }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  const { depotName, currency, distanceUnit } = req.body;
  try {
    const settings = await prisma.depotSettings.findFirst();
    if (settings) {
      const updated = await prisma.depotSettings.update({
        where: { id: settings.id },
        data: { depotName, currency, distanceUnit }
      });
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Settings not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPermissions = (req, res) => {
  res.json(PERMISSIONS);
};

module.exports = { getSettings, updateSettings, getPermissions };
