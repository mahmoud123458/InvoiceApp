import { Request, Response } from 'express';
import Client from '../models/Client';

// @desc   Get all clients
// @route  GET /api/clients
export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: clients.length, data: clients });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Get single client
// @route  GET /api/clients/:id
export const getClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }
    res.json({ success: true, data: client });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc   Create client
// @route  POST /api/clients
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update client
// @route  PUT /api/clients/:id
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete client
// @route  DELETE /api/clients/:id
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found' });
      return;
    }
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

