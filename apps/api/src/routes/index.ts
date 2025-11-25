import { Router } from 'express';
import authRoutes from './auth.routes';
import clientsRoutes from './clients.routes';
import policiesRoutes from './policies.routes';
import claimsRoutes from './claims.routes';
import quotesRoutes from './quotes.routes';
import productsRoutes from './products.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/policies', policiesRoutes);
router.use('/claims', claimsRoutes);
router.use('/quotes', quotesRoutes);
router.use('/products', productsRoutes);
router.use('/ai', aiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
