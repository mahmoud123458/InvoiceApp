import { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// @desc   Get all invoices
// @route  GET /api/invoices
export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, client, search } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (client) query.client = client;
    const invoices = await Invoice.find(query)
      .populate('client', 'name email phone')
      .populate('shippingCompany', 'name avgDeliveryDays')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single invoice
// @route  GET /api/invoices/:id
export const getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('shippingCompany')
      .populate('items.product')
      .populate('createdBy', 'name email');

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create invoice
// @route  POST /api/invoices
export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, tax = 0, discount = 0, ...rest } = req.body;
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      res.status(400).json({ success: false, message: 'An invoice must contain between 1 and 50 items' });
      return;
    }
    if (!['draft', 'sent'].includes(rest.status || 'draft')) {
      res.status(400).json({ success: false, message: 'Record a payment after creating the invoice' });
      return;
    }
    if (!Number.isFinite(Number(tax)) || Number(tax) < 0 || !Number.isFinite(Number(discount)) || Number(discount) < 0) {
      res.status(400).json({ success: false, message: 'Tax and discount must be non-negative numbers' });
      return;
    }

    // Calculate totals
    const processedItems = items.map((item: any) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('Invoice items require a positive quantity and non-negative price');
      }
      return { ...item, quantity, unitPrice, total: quantity * unitPrice };
    });

    const subtotal = processedItems.reduce((sum: number, item: any) => sum + item.total, 0);
    const total = Math.round((subtotal + (subtotal * Number(tax)) / 100 - Number(discount)) * 100) / 100;
    if (total < 0) {
      res.status(400).json({ success: false, message: 'Discount cannot exceed the invoice total' });
      return;
    }

    // Deduct from inventory
    for (const item of processedItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${item.productName} not found` });
        return;
      }
      if (product.quantity < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        });
        return;
      }
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
    }

    const invoice = await Invoice.create({
      ...rest,
      items: processedItems,
      subtotal,
      tax: Number(tax),
      discount: Number(discount),
      total,
      paidAmount: 0,
      payments: [],
      createdBy: req.user?._id,
    });

    const populated = await invoice.populate([
      { path: 'client', select: 'name email phone' },
      { path: 'shippingCompany', select: 'name' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update invoice
// @route  PUT /api/invoices/:id
export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const stockChanges: Array<{ productId: string; quantityDelta: number }> = [];
  try {
    const existing = await Invoice.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const submittedItems = req.body.items === undefined
      ? existing.items
      : req.body.items;
    if (!Array.isArray(submittedItems) || submittedItems.length === 0 || submittedItems.length > 50) {
      res.status(400).json({ success: false, message: 'An invoice must contain between 1 and 50 items' });
      return;
    }

    const items = [];
    for (const item of submittedItems) {
      const productId = String(item.product?._id || item.product || '');
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        res.status(400).json({ success: false, message: 'Invoice items require a valid product, positive quantity, and non-negative price' });
        return;
      }
      const product = await Product.findById(productId);
      if (!product) {
        res.status(400).json({ success: false, message: 'One of the selected products no longer exists' });
        return;
      }
      items.push({
        product: product._id,
        productName: product.name,
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Number(req.body.tax ?? existing.tax);
    const discount = Number(req.body.discount ?? existing.discount);
    if (!Number.isFinite(tax) || tax < 0 || !Number.isFinite(discount) || discount < 0) {
      res.status(400).json({ success: false, message: 'Tax and discount must be non-negative numbers' });
      return;
    }

    const oldQuantities = new Map<string, number>();
    const newQuantities = new Map<string, number>();
    for (const item of existing.items) {
      const productId = String((item.product as any)?._id || item.product);
      oldQuantities.set(productId, (oldQuantities.get(productId) || 0) + item.quantity);
    }
    for (const item of items) {
      const productId = String(item.product);
      newQuantities.set(productId, (newQuantities.get(productId) || 0) + item.quantity);
    }

    try {
      const productIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);
      for (const productId of productIds) {
        const quantityDelta = (newQuantities.get(productId) || 0) - (oldQuantities.get(productId) || 0);
        if (quantityDelta > 0) {
          const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, quantity: { $gte: quantityDelta } },
            { $inc: { quantity: -quantityDelta } },
            { new: true }
          );
          if (!updatedProduct) {
            const error = new Error('Insufficient stock for the updated invoice quantities') as Error & { status?: number };
            error.status = 409;
            throw error;
          }
          stockChanges.push({ productId, quantityDelta: -quantityDelta });
        } else if (quantityDelta < 0) {
          const updatedProduct = await Product.findByIdAndUpdate(productId, { $inc: { quantity: -quantityDelta } });
          if (updatedProduct) stockChanges.push({ productId, quantityDelta: -quantityDelta });
        }
      }

      const allowedStatuses = ['draft', 'sent', 'paid', 'cancelled'];
      let status = req.body.status ?? existing.status;
      if (!allowedStatuses.includes(status)) {
        const error = new Error('Invalid invoice status') as Error & { status?: number };
        error.status = 400;
        throw error;
      }
      const allowedShippingStatuses = ['pending', 'shipped', 'delivered', 'returned'];
      const shippingStatus = req.body.shippingStatus === null
        ? null
        : req.body.shippingStatus ?? existing.shippingStatus;
      if (shippingStatus && !allowedShippingStatuses.includes(shippingStatus)) {
        const error = new Error('Invalid shipping status') as Error & { status?: number };
        error.status = 400;
        throw error;
      }

      const total = Math.round((subtotal + (subtotal * tax) / 100 - discount) * 100) / 100;
      const paidAmount = Number(existing.paidAmount)
        || (existing.status === 'paid' ? Number(existing.total) : 0);
      if (total < 0 || total < paidAmount) {
        const error = new Error(total < 0
          ? 'Discount cannot exceed the invoice total'
          : 'Invoice total cannot be lower than the amount already paid') as Error & { status?: number };
        error.status = 400;
        throw error;
      }
      if (paidAmount > 0 && status === 'draft') {
        const error = new Error('An invoice with recorded payments cannot be moved back to draft') as Error & { status?: number };
        error.status = 400;
        throw error;
      }
      if (paidAmount >= total && status !== 'cancelled') status = 'paid';
      else if (status === 'paid') status = 'sent';

      const updatedInvoice: any = await Invoice.findByIdAndUpdate(req.params.id, {
        client: req.body.client || (existing.client as any)?._id || existing.client,
        items,
        subtotal,
        tax,
        discount,
        total,
        status,
        shippingCompany: req.body.shippingCompany === null
          ? undefined
          : req.body.shippingCompany ?? (existing.shippingCompany as any)?._id ?? existing.shippingCompany,
        shippingStatus,
        deliveredAt: req.body.deliveredAt === null ? null : req.body.deliveredAt ?? existing.deliveredAt,
        dueDate: req.body.dueDate === null ? undefined : req.body.dueDate ?? existing.dueDate,
        notes: req.body.notes ?? existing.notes,
      }, { new: true, runValidators: true });
      const invoice = typeof updatedInvoice?.populate === 'function'
        ? await updatedInvoice.populate('client shippingCompany')
        : updatedInvoice;

      if (!invoice) throw new Error('Invoice could not be updated');
      res.json({ success: true, data: invoice });
    } catch (error) {
      for (const change of stockChanges.reverse()) {
        await Product.findByIdAndUpdate(change.productId, { $inc: { quantity: -change.quantityDelta } });
      }
      throw error;
    }
  } catch (error: any) {
    res.status(error.status || 400).json({ success: false, message: error.message });
  }
};

export const addInvoicePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const amountValue = Number(req.body.amount);
  const amount = Math.round(amountValue * 100) / 100;
  const method = req.body.method;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const allowedMethods = ['cash', 'bank_transfer', 'card', 'cheque', 'other'];

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    return;
  }
  if (!allowedMethods.includes(method)) {
    res.status(400).json({ success: false, message: 'Select a valid payment method' });
    return;
  }
  if (Number.isNaN(date.getTime())) {
    res.status(400).json({ success: false, message: 'Enter a valid payment date' });
    return;
  }

  try {
    const current: any = await Invoice.findById(req.params.id);
    if (!current) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }
    if (current.status === 'draft' || current.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Payments can only be recorded for sent invoices' });
      return;
    }
    const paidAmount = Number(current.paidAmount)
      || (current.status === 'paid' ? Number(current.total) : 0);
    if (amount > Number(current.total) - paidAmount) {
      res.status(400).json({ success: false, message: 'Payment cannot exceed the remaining invoice balance' });
      return;
    }

    const payment = {
      amount,
      date,
      method,
      reference: typeof req.body.reference === 'string' ? req.body.reference.trim() : undefined,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : undefined,
      recordedBy: req.user?._id,
    };
    const updated = await Invoice.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $nin: ['draft', 'cancelled'] },
        $expr: { $lte: [{ $add: ['$paidAmount', amount] }, '$total'] },
      },
      { $inc: { paidAmount: amount }, $push: { payments: payment } },
      { new: true, runValidators: true }
    ) as any;
    if (!updated) {
      res.status(409).json({ success: false, message: 'The invoice balance changed. Refresh and try again.' });
      return;
    }

    const statusFilter = updated.paidAmount >= updated.total
      ? { $expr: { $gte: ['$paidAmount', '$total'] } }
      : { $expr: { $lt: ['$paidAmount', '$total'] } };
    await Invoice.findOneAndUpdate(
      { _id: req.params.id, ...statusFilter },
      { $set: { status: updated.paidAmount >= updated.total ? 'paid' : 'sent' } }
    );
    const invoice: any = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('shippingCompany')
      .populate('items.product')
      .populate('createdBy', 'name email');
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Unable to record invoice payment:', error);
    res.status(500).json({ success: false, message: 'Unable to record payment' });
  }
};

// @desc   Delete invoice
// @route  DELETE /api/invoices/:id
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing: any = await Invoice.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }
    if (Number(existing.paidAmount) > 0 || existing.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Invoices with recorded payments cannot be deleted. Cancel the invoice to preserve its financial history.',
      });
      return;
    }
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get invoice stats
// @route  GET /api/invoices/stats
export const getInvoiceStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' },
        },
      },
    ]);

    const totalRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
