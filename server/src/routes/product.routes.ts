import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  restoreProduct,
  validateSku
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/validate-sku', validateSku);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/restore', restoreProduct);

export default router;
