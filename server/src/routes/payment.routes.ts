import { Router } from 'express';
import {
  getPayments,
  getPaymentById,
  createPayment,
  reversePayment
} from '../controllers/payment.controller.js';

const router = Router();

router.get('/', getPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.post('/:id/reverse', reversePayment);

export default router;
