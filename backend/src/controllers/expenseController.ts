import { Request, Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

const paymentMethods = ['cash', 'bank_transfer', 'card', 'cheque', 'other'];

function validDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateExpense(body: any): string | null {
  if (typeof body.description !== 'string' || !body.description.trim() || body.description.trim().length > 160) {
    return 'Description is required and must be 160 characters or fewer';
  }
  if (typeof body.category !== 'string' || !body.category.trim() || body.category.trim().length > 80) {
    return 'Category is required and must be 80 characters or fewer';
  }
  if (!Number.isFinite(Number(body.amount)) || Number(body.amount) <= 0) {
    return 'Amount must be greater than zero';
  }
  if (!validDate(body.date)) return 'A valid expense date is required';
  if (!paymentMethods.includes(body.paymentMethod)) return 'Select a valid payment method';
  return null;
}

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: Record<string, unknown> = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.from || req.query.to) {
      const date: Record<string, Date> = {};
      if (req.query.from) {
        const from = validDate(req.query.from);
        if (!from) {
          res.status(400).json({ success: false, message: 'Invalid start date' });
          return;
        }
        date.$gte = from;
      }
      if (req.query.to) {
        const to = validDate(req.query.to);
        if (!to) {
          res.status(400).json({ success: false, message: 'Invalid end date' });
          return;
        }
        to.setHours(23, 59, 59, 999);
        date.$lte = to;
      }
      query.date = date;
    }
    const expenses = await Expense.find(query).populate('createdBy', 'name').sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    console.error('Unable to load expenses:', error);
    res.status(500).json({ success: false, message: 'Unable to load expenses' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const validationError = validateExpense(req.body);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    const expense = await Expense.create({
      description: req.body.description.trim(),
      category: req.body.category.trim(),
      amount: Number(req.body.amount),
      date: validDate(req.body.date),
      paymentMethod: req.body.paymentMethod,
      reference: typeof req.body.reference === 'string' ? req.body.reference.trim() : undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : undefined,
      createdBy: req.user?._id,
    });
    const populated = typeof expense.populate === 'function'
      ? await expense.populate('createdBy', 'name')
      : expense;
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Unable to create expense:', error);
    res.status(400).json({ success: false, message: 'Unable to create expense' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const validationError = validateExpense(req.body);
  if (validationError) {
    res.status(400).json({ success: false, message: validationError });
    return;
  }
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, {
      description: req.body.description.trim(),
      category: req.body.category.trim(),
      amount: Number(req.body.amount),
      date: validDate(req.body.date),
      paymentMethod: req.body.paymentMethod,
      reference: typeof req.body.reference === 'string' ? req.body.reference.trim() : undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : undefined,
    }, { new: true, runValidators: true });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    const populated = typeof expense.populate === 'function'
      ? await expense.populate('createdBy', 'name')
      : expense;
    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Unable to update expense:', error);
    res.status(400).json({ success: false, message: 'Unable to update expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Unable to delete expense:', error);
    res.status(500).json({ success: false, message: 'Unable to delete expense' });
  }
};
