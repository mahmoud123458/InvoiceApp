import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Invoice from '../models/Invoice';

interface DateRange {
  from: Date;
  to: Date;
}

function getDateRange(query: Request['query']): DateRange | null {
  const now = new Date();
  const from = query.from
    ? new Date(`${String(query.from)}T00:00:00.000Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const to = query.to
    ? new Date(`${String(query.to)}T23:59:59.999Z`)
    : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  return { from, to };
}

function isInRange(value: unknown, range: DateRange): boolean {
  const date = new Date(value as string | number | Date);
  return !Number.isNaN(date.getTime()) && date >= range.from && date <= range.to;
}

function getInvoicePayments(invoice: any): any[] {
  if (Array.isArray(invoice.payments) && invoice.payments.length > 0) return invoice.payments;
  const paidAmount = Number(invoice.paidAmount) || (invoice.status === 'paid' ? Number(invoice.total) || 0 : 0);
  if (!paidAmount) return [];
  return [{
    amount: paidAmount,
    date: invoice.createdAt,
    method: 'other',
    notes: 'Recorded as paid before payment tracking was enabled',
  }];
}

function clientName(client: any): string {
  return typeof client === 'object' && client !== null ? client.name || 'Client' : 'Client';
}

export const getFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  const range = getDateRange(req.query);
  if (!range) {
    res.status(400).json({ success: false, message: 'Provide a valid date range with the start on or before the end' });
    return;
  }

  try {
    const dateFilter = { $gte: range.from, $lte: range.to };
    const invoiceFilter = {
      $or: [
        { status: 'sent' },
        { createdAt: dateFilter, status: { $ne: 'cancelled' } },
        { 'payments.date': dateFilter },
      ],
    };
    const [invoices, expenses] = await Promise.all([
      Invoice.find(invoiceFilter)
        .select('invoiceNumber status total paidAmount payments createdAt dueDate client')
        .populate('client', 'name')
        .lean(),
      Expense.find({ date: dateFilter })
        .select('description category amount date paymentMethod reference')
        .lean(),
    ]);

    const cashTransactions: Array<Record<string, unknown>> = [];
    const monthly = new Map<string, { month: string; income: number; expenses: number }>();
    for (let month = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1));
      month <= range.to;
      month = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))) {
      const key = month.toISOString().slice(0, 7);
      monthly.set(key, { month: key, income: 0, expenses: 0 });
    }

    let totalInvoiced = 0;
    let collected = 0;
    const outstandingInvoices: Array<Record<string, unknown>> = [];
    for (const invoice of invoices as any[]) {
      if (invoice.status !== 'cancelled' && invoice.status !== 'draft' && isInRange(invoice.createdAt, range)) {
        totalInvoiced += Number(invoice.total) || 0;
      }

      const paidAmount = Number(invoice.paidAmount) || (invoice.status === 'paid' ? Number(invoice.total) || 0 : 0);
      const amountDue = Math.max(0, (Number(invoice.total) || 0) - paidAmount);
      if (invoice.status !== 'cancelled' && invoice.status !== 'draft' && amountDue > 0) {
        outstandingInvoices.push({
          _id: String(invoice._id),
          invoiceNumber: invoice.invoiceNumber,
          clientName: clientName(invoice.client),
          amountDue,
          dueDate: invoice.dueDate || null,
        });
      }

      for (const payment of getInvoicePayments(invoice)) {
        if (!isInRange(payment.date || invoice.createdAt, range)) continue;
        const amount = Number(payment.amount) || 0;
        collected += amount;
        const date = new Date(payment.date || invoice.createdAt);
        const month = monthly.get(date.toISOString().slice(0, 7));
        if (month) month.income += amount;
        cashTransactions.push({
          id: `${invoice._id}-${payment._id || date.getTime()}`,
          type: 'income',
          description: `Payment for ${invoice.invoiceNumber}`,
          category: 'Invoice payment',
          amount,
          date,
          method: payment.method || 'other',
          reference: payment.reference || '',
        });
      }
    }

    let expenseTotal = 0;
    const categoryTotals = new Map<string, number>();
    for (const expense of expenses as any[]) {
      if (!isInRange(expense.date, range)) continue;
      const amount = Number(expense.amount) || 0;
      expenseTotal += amount;
      categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + amount);
      const month = monthly.get(new Date(expense.date).toISOString().slice(0, 7));
      if (month) month.expenses += amount;
      cashTransactions.push({
        id: String(expense._id),
        type: 'expense',
        description: expense.description,
        category: expense.category,
        amount,
        date: expense.date,
        method: expense.paymentMethod,
        reference: expense.reference || '',
      });
    }

    outstandingInvoices.sort((a, b) => Number(b.amountDue) - Number(a.amountDue));
    cashTransactions.sort((a, b) => new Date(b.date as string | Date).getTime() - new Date(a.date as string | Date).getTime());
    const cashFlow = [...monthly.values()].map((month) => ({
      ...month,
      net: month.income - month.expenses,
    }));

    res.json({
      success: true,
      data: {
        from: range.from,
        to: range.to,
        totalInvoiced,
        collected,
        outstanding: outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.amountDue), 0),
        expenses: expenseTotal,
        netCashFlow: collected - expenseTotal,
        outstandingInvoices,
        cashFlow,
        expenseCategories: [...categoryTotals.entries()]
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
        recentTransactions: cashTransactions.slice(0, 12),
      },
    });
  } catch (error) {
    console.error('Unable to build financial summary:', error);
    res.status(500).json({ success: false, message: 'Unable to load financial summary' });
  }
};
