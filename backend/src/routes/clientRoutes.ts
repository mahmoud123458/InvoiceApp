import { Router } from 'express';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.use(authorize('admin', 'user'));
router.route('/').get(getClients).post(createClient);
router.route('/:id').get(getClient).put(updateClient).delete(deleteClient);

export default router;

