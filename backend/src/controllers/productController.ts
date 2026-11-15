import { Request, Response } from 'express';
import Product from '../models/Product';

// @desc   Get all products
// @route  GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, lowStock } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Add low stock flag
    const productsWithFlags = products.map((p) => ({
      ...p.toObject(),
      isLowStock: p.quantity <= p.lowStockAlert,
    }));

    if (lowStock === 'true') {
      const lowStockProducts = productsWithFlags.filter((p) => p.isLowStock);
      res.json({ success: true, count: lowStockProducts.length, data: lowStockProducts });
      return;
    }

    res.json({ success: true, count: products.length, data: productsWithFlags });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single product
// @route  GET /api/products/:id
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create product
// @route  POST /api/products
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update product
// @route  PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete product
// @route  DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

