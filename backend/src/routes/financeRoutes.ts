import { Router } from 'express';
import { getFinancialSummary } from '../controllers/financeController';
import { authorize, protect } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin', 'user'));
router.get('/summary', getFinancialSummary);

export default router;
