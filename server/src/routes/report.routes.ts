import { Router } from 'express';
import { 
  getSalesDetailReport, 
  getPurchasesReport, 
  getInventoryReport, 
  getPaymentsReport, 
  getCustomersReport, 
  getSuppliersReport,
  getDashboardStatsReport
} from '../controllers/report.controller.js';

const router = Router();

router.get('/sales', getSalesDetailReport);
router.get('/purchases', getPurchasesReport);
router.get('/inventory', getInventoryReport);
router.get('/payments', getPaymentsReport);
router.get('/customers', getCustomersReport);
router.get('/suppliers', getSuppliersReport);
router.get('/dashboard', getDashboardStatsReport);

export default router;
