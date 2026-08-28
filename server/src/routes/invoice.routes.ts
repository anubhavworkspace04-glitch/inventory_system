import { Router } from 'express';
import { 
  getInvoices, 
  getInvoiceById, 
  getInvoiceBySaleId, 
  createInvoice, 
  downloadInvoicePdf,
  updateInvoice
} from '../controllers/invoice.controller.js';

const router = Router();

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/sale/:saleId', getInvoiceBySaleId);
router.get('/:id', getInvoiceById);
router.patch('/:id', updateInvoice);
router.get('/:id/download', downloadInvoicePdf);

export default router;
