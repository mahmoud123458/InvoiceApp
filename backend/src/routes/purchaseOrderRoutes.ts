import { Router } from 'express';
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
} from '../controllers/purchaseOrderController';
import { protect, adminOnly, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.route('/').get(authorize('admin', 'user'), getPurchaseOrders).post(authorize('admin', 'user'), createPurchaseOrder);
router.get('/:id', authorize('admin', 'user'), getPurchaseOrder);
router.put('/:id/approve', adminOnly, approvePurchaseOrder);
router.put('/:id/reject', adminOnly, rejectPurchaseOrder);

export default router;

