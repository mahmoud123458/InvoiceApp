import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return jwt.sign({ id }, secret || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

// @desc   Login user
// @route  POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !['admin', 'user'].includes(user.role) || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, password, role } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!normalizedName || !email || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Name, a valid email, and a password of at least 8 characters are required' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }
    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ success: false, message: 'Role must be admin or user' });
      return;
    }
    if (await User.findOne({ email })) {
      res.status(409).json({ success: false, message: 'Email already has an account' });
      return;
    }

    const user = await User.create({ name: normalizedName, email, password, role });
    const { password: _password, ...safeUser } = user.toObject ? user.toObject() : user;
    res.status(201).json({ success: true, data: safeUser });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Unable to create account' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : user.name;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : user.email;
    const role = req.body.role ?? user.role;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A name and valid email are required' });
      return;
    }
    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ success: false, message: 'Role must be admin or user' });
      return;
    }
    const emailOwner = await User.findOne({ email });
    if (emailOwner && String(emailOwner._id) !== String(user._id)) {
      res.status(409).json({ success: false, message: 'Email already has an account' });
      return;
    }

    if (user.role === 'admin' && role !== 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) {
      res.status(400).json({ success: false, message: 'The last administrator cannot be demoted' });
      return;
    }

    const updates: Record<string, unknown> = { name, email, role };

    if (req.body.password !== undefined && req.body.password !== '') {
      if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
        res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        return;
      }
      updates.password = await bcrypt.hash(req.body.password, await bcrypt.genSalt(10));
    }

    const update: Record<string, unknown> = { $set: updates };
    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    const userData = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    const { password: _password, ...safeUser } = userData;
    res.json({ success: true, data: safeUser });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Unable to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (String(user._id) === String(req.user?._id)) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }
    if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) {
      res.status(400).json({ success: false, message: 'The last administrator cannot be deleted' });
      return;
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to delete user' });
  }
};

// @desc   Get current user profile
// @route  GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: req.user });
};
