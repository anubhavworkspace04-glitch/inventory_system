import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  restoreSupplier
} from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deactivateSupplier);
router.post('/:id/restore', restoreSupplier);

export default router;
