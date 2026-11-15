import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

type UserRole = IUser['role'];

export const authorize = (...roles: UserRole[]) => (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    return;
  }
  next();
};

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Not authorized, no token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      res.status(500).json({ success: false, message: 'Authentication is not configured' });
      return;
    }
    const decoded = jwt.verify(token, secret || 'secret') as { id: string };

    const query: any = User.findById(decoded.id);
    const user = typeof query?.select === 'function' ? await query.select('-password') : await query;

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    if (!['admin', 'user'].includes(user.role)) {
      res.status(401).json({ success: false, message: 'This account type is no longer available' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('Auth verification error:', err.message);
    res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  authorize('admin')(req, res, next);
};
