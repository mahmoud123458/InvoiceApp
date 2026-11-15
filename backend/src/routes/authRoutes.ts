import { Router } from 'express';
import { login, getMe, getUsers, createUser, updateUser, deleteUser } from '../controllers/authController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.route('/users').get(protect, adminOnly, getUsers).post(protect, adminOnly, createUser);
router.route('/users/:id').put(protect, adminOnly, updateUser).delete(protect, adminOnly, deleteUser);
router.get('/me', protect, getMe);

export default router;
