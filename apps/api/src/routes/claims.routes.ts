import { Router } from 'express';
import { claimsController } from '../controllers/claims.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createClaimSchema } from '@insurance/types';

const router = Router();

router.use(authenticate);

router.post('/', validate(createClaimSchema), claimsController.createClaim.bind(claimsController));
router.get('/', claimsController.getClaims.bind(claimsController));
router.get('/:id', claimsController.getClaim.bind(claimsController));
router.post('/:id/analyze', authorize('ADMIN', 'BROKER'), claimsController.analyzeClaim.bind(claimsController));
router.put('/:id/status', authorize('ADMIN', 'BROKER'), claimsController.updateClaimStatus.bind(claimsController));

export default router;
