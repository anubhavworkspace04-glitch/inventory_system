import { Router } from 'express';
import { 
  getSales, 
  getSaleById, 
  createSale, 
  cancelSale 
} from '../controllers/sale.controller.js';

const router = Router();

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.post('/:id/cancel', cancelSale);

export default router;
