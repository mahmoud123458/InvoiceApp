import { Request, Response } from 'express';
import ShippingCompany from '../models/ShippingCompany';
import Invoice from '../models/Invoice';

// @desc   Get all shipping companies
// @route  GET /api/shipping
export const getShippingCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await ShippingCompany.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: companies.length, data: companies });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get shipping company stats
// @route  GET /api/shipping/:id/stats
export const getShippingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await ShippingCompany.findById(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Shipping company not found' });
      return;
    }

    const totalInvoices = await Invoice.countDocuments({ shippingCompany: req.params.id });
    const deliveredInvoices = await Invoice.countDocuments({
      shippingCompany: req.params.id,
      shippingStatus: 'delivered',
    });

    const deliveryRate = totalInvoices > 0 ? (deliveredInvoices / totalInvoices) * 100 : 0;

    res.json({
      success: true,
      data: {
        company,
        stats: {
          totalInvoices,
          deliveredInvoices,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          avgDeliveryDays: company.avgDeliveryDays,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create shipping company
// @route  POST /api/shipping
export const createShippingCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await ShippingCompany.create(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update shipping company
// @route  PUT /api/shipping/:id
export const updateShippingCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await ShippingCompany.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!company) {
      res.status(404).json({ success: false, message: 'Shipping company not found' });
      return;
    }
    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete shipping company
// @route  DELETE /api/shipping/:id
export const deleteShippingCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await ShippingCompany.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!company) {
      res.status(404).json({ success: false, message: 'Shipping company not found' });
      return;
    }
    res.json({ success: true, message: 'Shipping company deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

