import { Router } from 'express';
import { clientsController } from '../controllers/clients.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createClientSchema } from '@insurance/types';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate(createClientSchema),
  clientsController.createClient.bind(clientsController)
);

router.get('/', authorize('ADMIN', 'BROKER'), clientsController.getClients.bind(clientsController));
router.get('/:id', clientsController.getClient.bind(clientsController));
router.put('/:id', clientsController.updateClient.bind(clientsController));

export default router;
