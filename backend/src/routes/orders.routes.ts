import { Router } from 'express';
import { checkout, listOrders, getOrder } from '../controllers/orders.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/checkout', checkout);
router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
