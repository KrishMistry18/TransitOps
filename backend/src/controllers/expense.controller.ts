import { Request, Response } from 'express';
import { ExpenseModel } from '../models/Expense';

// GET /api/expenses — filterable by vehicleId
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.query.vehicleId) query.vehicle = req.query.vehicleId;
    const expenses = await ExpenseModel.find(query)
      .populate({ path: 'vehicle', select: 'name registrationNumber' })
      .sort({ date: -1 });
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// POST /api/expenses — { vehicleId, type, amount, description, date }
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { vehicleId, type, amount, description, date } = req.body;

    if (Number(amount) < 0) return res.status(400).json({ message: 'Amount must be >= 0' });

    const expense = await ExpenseModel.create({
      vehicle: vehicleId,
      type,
      amount: Number(amount),
      description,
      date: date ? new Date(date) : new Date(),
    });

    const populated = await ExpenseModel.findById(expense._id)
      .populate({ path: 'vehicle', select: 'name registrationNumber' });
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
};
