import { Router } from 'express';
import { 
  getStockHistory, 
  getStockMovementById,
  adjustStock, 
  reconcileVariantStock 
} from '../controllers/stock.controller.js';

const router = Router();

router.get('/history', getStockHistory);
router.get('/history/:id', getStockMovementById);
router.post('/adjust', adjustStock);
router.get('/reconcile/:productId/:variantId', reconcileVariantStock);

export default router;
