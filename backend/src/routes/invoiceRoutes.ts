import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  addInvoicePayment,
} from '../controllers/invoiceController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/stats', authorize('admin', 'user'), getInvoiceStats);
router.get('/', getInvoices);
router.post('/', authorize('admin', 'user'), createInvoice);
router.get('/:id', getInvoice);
router.post('/:id/payments', authorize('admin', 'user'), addInvoicePayment);
router.put('/:id', authorize('admin', 'user'), updateInvoice);
router.delete('/:id', authorize('admin', 'user'), deleteInvoice);

export default router;
