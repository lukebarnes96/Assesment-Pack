import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  riskAssessmentService,
  policyRecommendationService,
  claimsAnalysisService,
  documentAnalysisService,
  chatbotService,
} from '@insurance/ai-services';
import { prisma } from '@insurance/database';

export class AIController {
  async assessRisk(req: AuthRequest, res: Response) {
    try {
      const { clientId, assessmentType, data } = req.body;

      const result = await riskAssessmentService.assessRisk({
        clientId,
        assessmentType,
        data,
      });

      // Save assessment to database
      await prisma.riskAssessment.create({
        data: {
          clientId,
          assessmentType,
          riskLevel: result.riskLevel,
          riskScore: result.riskScore,
          factors: result.factors as any,
          recommendations: result.recommendations as any,
          aiModel: 'gpt-4-turbo',
        },
      });

      // Update client risk profile
      await prisma.client.update({
        where: { id: clientId },
        data: {
          riskProfile: result as any,
        },
      });

      return res.json(result);
    } catch (error) {
      console.error('Risk assessment error:', error);
      return res.status(500).json({ error: 'Failed to assess risk' });
    }
  }

  async recommendPolicies(req: AuthRequest, res: Response) {
    try {
      const { clientId, insuranceType, budget, preferences } = req.body;

      const recommendations = await policyRecommendationService.recommendPolicies({
        clientId,
        insuranceType,
        budget,
        preferences,
      });

      return res.json(recommendations);
    } catch (error) {
      console.error('Policy recommendation error:', error);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  async analyzeClaim(req: AuthRequest, res: Response) {
    try {
      const { claimId } = req.params;

      const analysis = await claimsAnalysisService.analyzeClaim(claimId);

      return res.json(analysis);
    } catch (error) {
      console.error('Claim analysis error:', error);
      return res.status(500).json({ error: 'Failed to analyze claim' });
    }
  }

  async detectFraud(req: AuthRequest, res: Response) {
    try {
      const { clientId } = req.params;

      const result = await claimsAnalysisService.detectFraudPatterns(clientId);

      return res.json(result);
    } catch (error) {
      console.error('Fraud detection error:', error);
      return res.status(500).json({ error: 'Failed to detect fraud patterns' });
    }
  }

  async analyzeDocument(req: AuthRequest, res: Response) {
    try {
      const { documentType, documentText, metadata } = req.body;

      const analysis = await documentAnalysisService.analyzeDocument(
        documentType,
        documentText,
        metadata
      );

      return res.json(analysis);
    } catch (error) {
      console.error('Document analysis error:', error);
      return res.status(500).json({ error: 'Failed to analyze document' });
    }
  }

  async chat(req: AuthRequest, res: Response) {
    try {
      const { sessionId, message } = req.body;
      const userId = req.user!.id;

      const response = await chatbotService.chat(userId, sessionId, message);

      return res.json(response);
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({ error: 'Failed to process chat message' });
    }
  }

  async createChatSession(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const sessionId = await chatbotService.createSession(userId);

      return res.json({ sessionId });
    } catch (error) {
      console.error('Create chat session error:', error);
      return res.status(500).json({ error: 'Failed to create chat session' });
    }
  }

  async getChatSessions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const sessions = await chatbotService.getSessions(userId);

      return res.json(sessions);
    } catch (error) {
      console.error('Get chat sessions error:', error);
      return res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  }
}

export const aiController = new AIController();
