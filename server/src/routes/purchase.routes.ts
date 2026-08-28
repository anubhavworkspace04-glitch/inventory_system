import { Router } from 'express';
import { 
  getPurchases, 
  getPurchaseById, 
  createPurchase, 
  cancelPurchase 
} from '../controllers/purchase.controller.js';

const router = Router();

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.post('/:id/cancel', cancelPurchase);

export default router;
