import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deactivateCustomer,
  restoreCustomer
} from '../controllers/customer.controller.js';
import { getCustomerLedger } from '../controllers/payment.controller.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/ledger', getCustomerLedger);
router.post('/', createCustomer);
router.patch('/:id', updateCustomer);
router.delete('/:id', deactivateCustomer);
router.post('/:id/restore', restoreCustomer);

export default router;
