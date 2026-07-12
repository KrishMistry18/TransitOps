import { Request, Response } from 'express';
import { PrismaClient, ExpenseType } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_TYPES: ExpenseType[] = ['TOLL', 'MAINTENANCE', 'OTHER'];

// POST /api/expenses — create expense (Req 9.4, 9.5)
export async function createExpense(req: Request, res: Response) {
  try {
    const vehicleId = String(req.body.vehicleId);
    // Accept `type` (canonical) or `category` (requirements wording); default OTHER.
    const rawType = (req.body.type ?? req.body.category ?? 'OTHER') as ExpenseType;
    const type = VALID_TYPES.includes(rawType) ? rawType : 'OTHER';
    // Accept `amount` (canonical) or `cost` (requirements wording).
    const amount = Number(req.body.amount ?? req.body.cost);
    const description = req.body.description ?? req.body.note ?? null;
    const date = req.body.date ? new Date(req.body.date) : new Date();

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'Cost cannot be negative' }); // Req 9.5
    }

    // Validate the FK before writing — prevents orphaned expenses that later crash reads.
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const expense = await prisma.expense.create({
      data: { vehicleId, type, amount, description, date },
    });
    return res.status(201).json({ success: true, data: expense });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
}

export async function listExpenses(req: Request, res: Response) {
  try {
    const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
    // Join manually rather than via Prisma `include` — a required relation `include`
    // throws if any expense references a deleted/missing vehicle (data drift).
    const expenses = await prisma.expense.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      orderBy: { date: 'desc' },
    });
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: [...new Set(expenses.map((e) => e.vehicleId))] } },
      select: { id: true, name: true, registrationNumber: true },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const result = expenses.map((e) => ({ ...e, vehicle: vehicleById.get(e.vehicleId) ?? null }));
    // Raw array with populated vehicle — matches the Fuel page shape.
    return res.json(result);
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
}

// GET /api/expenses/operational-cost/:id — Operational_Cost = fuel + maintenance (Req 9.6, 9.8)
export async function getOperationalCost(req: Request, res: Response) {
  try {
    const vehicleId = String(req.params.id);

    const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
      prisma.fuelLog.findMany({ where: { vehicleId } }),
      prisma.maintenanceLog.findMany({ where: { vehicleId } }),
      prisma.expense.findMany({ where: { vehicleId } }),
    ]);

    const fuelTotal = fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceTotal = maintenanceLogs.reduce((s, m) => s + (m.cost ?? 0), 0);
    const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);

    return res.json({
      success: true,
      data: {
        vehicleId,
        fuelTotal,
        maintenanceTotal,
        expenseTotal,
        operationalCost: fuelTotal + maintenanceTotal, // Req 9.6 / 10.4
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to compute operational cost' });
  }
}
