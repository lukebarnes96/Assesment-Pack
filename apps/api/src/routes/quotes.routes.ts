import { Router } from 'express';
import { quotesController } from '../controllers/quotes.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createQuoteSchema } from '@insurance/types';

const router = Router();

router.use(authenticate);

router.post('/', validate(createQuoteSchema), quotesController.createQuote.bind(quotesController));
router.get('/', quotesController.getQuotes.bind(quotesController));
router.get('/:id', quotesController.getQuote.bind(quotesController));
router.post('/:id/accept', quotesController.acceptQuote.bind(quotesController));
router.post('/compare', quotesController.compareQuotes.bind(quotesController));
router.post('/recommendations', quotesController.getAIRecommendations.bind(quotesController));

export default router;
