import { Router } from 'express';
import {
  getShippingCompanies,
  getShippingStats,
  createShippingCompany,
  updateShippingCompany,
  deleteShippingCompany,
} from '../controllers/shippingController';
import { protect, adminOnly, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', authorize('admin', 'user'), getShippingCompanies);
router.post('/', adminOnly, createShippingCompany);
router.get('/:id/stats', authorize('admin', 'user'), getShippingStats);
router.put('/:id', adminOnly, updateShippingCompany);
router.delete('/:id', adminOnly, deleteShippingCompany);

export default router;

