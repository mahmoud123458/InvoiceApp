import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { protect, adminOnly, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', authorize('admin', 'user'), getProducts);
router.post('/', adminOnly, createProduct);
router.get('/:id', authorize('admin', 'user'), getProduct);
router.put('/:id', adminOnly, updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

export default router;
