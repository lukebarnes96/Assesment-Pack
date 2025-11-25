import { Router } from 'express';
import { productsController } from '../controllers/products.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, productsController.getProducts.bind(productsController));
router.get('/:id', authenticate, productsController.getProduct.bind(productsController));

// Admin only routes
router.use(authenticate, authorize('ADMIN'));
router.post('/', productsController.createProduct.bind(productsController));
router.put('/:id', productsController.updateProduct.bind(productsController));
router.delete('/:id', productsController.deactivateProduct.bind(productsController));

export default router;
