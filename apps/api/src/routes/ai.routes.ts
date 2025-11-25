import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/risk-assessment', authorize('ADMIN', 'BROKER'), aiController.assessRisk.bind(aiController));
router.post('/policy-recommendations', aiController.recommendPolicies.bind(aiController));
router.post('/claims/:claimId/analyze', authorize('ADMIN', 'BROKER'), aiController.analyzeClaim.bind(aiController));
router.get('/fraud-detection/:clientId', authorize('ADMIN', 'BROKER'), aiController.detectFraud.bind(aiController));
router.post('/document-analysis', aiController.analyzeDocument.bind(aiController));

// Chatbot routes
router.post('/chat/sessions', aiController.createChatSession.bind(aiController));
router.get('/chat/sessions', aiController.getChatSessions.bind(aiController));
router.post('/chat', aiController.chat.bind(aiController));

export default router;
