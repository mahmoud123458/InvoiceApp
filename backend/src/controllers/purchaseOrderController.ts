import { Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// @desc   Get all purchase orders
// @route  GET /api/purchase-orders
export const getPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;

    const orders = await PurchaseOrder.find(query)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single purchase order
// @route  GET /api/purchase-orders/:id
export const getPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product');

    if (!order) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create purchase order
// @route  POST /api/purchase-orders
export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, ...rest } = req.body;

    const processedItems = items.map((item: any) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = processedItems.reduce((sum: number, item: any) => sum + item.total, 0);

    const order = await PurchaseOrder.create({
      ...rest,
      items: processedItems,
      subtotal,
      total: subtotal,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Approve purchase order → updates inventory
// @route  PUT /api/purchase-orders/:id/approve
export const approvePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }
    if (order.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Order is not in pending status' });
      return;
    }

    // Update inventory quantities
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity },
      });
    }

    // Update order status
    order.status = 'approved';
    order.approvedBy = req.user?._id;
    order.approvedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Purchase order approved and inventory updated',
      data: order,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Reject purchase order
// @route  PUT /api/purchase-orders/:id/reject
export const rejectPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!order) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }
    res.json({ success: true, message: 'Purchase order rejected', data: order });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

