import { Router } from 'express';
import { policiesController } from '../controllers/policies.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'BROKER'), policiesController.createPolicy.bind(policiesController));
router.get('/', policiesController.getPolicies.bind(policiesController));
router.get('/:id', policiesController.getPolicy.bind(policiesController));
router.put('/:id', authorize('ADMIN', 'BROKER'), policiesController.updatePolicy.bind(policiesController));
router.post('/:id/activate', authorize('ADMIN', 'BROKER'), policiesController.activatePolicy.bind(policiesController));

export default router;
