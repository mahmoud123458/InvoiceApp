import { Router } from 'express';
import { createExpense, deleteExpense, getExpenses, updateExpense } from '../controllers/expenseController';
import { authorize, protect } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin', 'user'));
router.route('/')
  .get(getExpenses)
  .post(createExpense);
router.route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

export default router;
