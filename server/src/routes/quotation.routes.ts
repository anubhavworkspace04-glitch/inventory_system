import { Router } from 'express';
import { 
  getQuotations, 
  getQuotationById, 
  createQuotation,
  updateQuotation,
  acceptQuotation,
  rejectQuotation,
  cancelQuotation,
  convertToSale,
  duplicateQuotation
} from '../controllers/quotation.controller.js';

const router = Router();

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', createQuotation);
router.patch('/:id', updateQuotation);

router.post('/:id/accept', acceptQuotation);
router.post('/:id/reject', rejectQuotation);
router.post('/:id/cancel', cancelQuotation);
router.post('/:id/convert-to-sale', convertToSale);
router.post('/:id/duplicate', duplicateQuotation);

export default router;
