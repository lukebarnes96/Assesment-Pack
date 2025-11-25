import { Response } from 'express';
import { prisma } from '@insurance/database';
import { AuthRequest } from '../middleware/auth';
import { claimsAnalysisService } from '@insurance/ai-services';
import type { CreateClaimInput } from '@insurance/types';

export class ClaimsController {
  async createClaim(req: AuthRequest<{}, {}, CreateClaimInput>, res: Response) {
    try {
      const { policyId, incidentDate, claimAmount, description } = req.body;

      // Verify policy exists and is active
      const policy = await prisma.policy.findUnique({
        where: { id: policyId },
        include: { client: true },
      });

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      if (policy.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Policy is not active' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && policy.client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate claim number
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const claim = await prisma.claim.create({
        data: {
          claimNumber,
          clientId: policy.clientId,
          policyId,
          incidentDate: new Date(incidentDate),
          claimAmount,
          description,
          status: 'SUBMITTED',
        },
        include: {
          policy: {
            include: {
              product: true,
            },
          },
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      // Trigger AI analysis asynchronously
      this.analyzeClaimAsync(claim.id);

      return res.status(201).json(claim);
    } catch (error) {
      console.error('Create claim error:', error);
      return res.status(500).json({ error: 'Failed to create claim' });
    }
  }

  async getClaims(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      let where: any = {};

      if (req.user!.role === 'CLIENT') {
        const client = await prisma.client.findUnique({
          where: { userId: req.user!.id },
        });
        if (client) {
          where.clientId = client.id;
        }
      }

      if (status) {
        where.status = status;
      }

      const [claims, total] = await Promise.all([
        prisma.claim.findMany({
          where,
          skip,
          take: limit,
          include: {
            policy: {
              include: {
                product: true,
              },
            },
            client: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            documents: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.claim.count({ where }),
      ]);

      return res.json({
        data: claims,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get claims error:', error);
      return res.status(500).json({ error: 'Failed to fetch claims' });
    }
  }

  async getClaim(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const claim = await prisma.claim.findUnique({
        where: { id },
        include: {
          policy: {
            include: {
              product: true,
            },
          },
          client: {
            include: {
              user: true,
            },
          },
          documents: true,
        },
      });

      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && claim.client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(claim);
    } catch (error) {
      console.error('Get claim error:', error);
      return res.status(500).json({ error: 'Failed to fetch claim' });
    }
  }

  async analyzeClaim(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const analysis = await claimsAnalysisService.analyzeClaim(id);

      // Update claim with AI analysis
      await prisma.claim.update({
        where: { id },
        data: {
          aiAnalysis: analysis as any,
          aiRecommendation: {
            action: analysis.recommendedAction,
            estimatedSettlement: analysis.estimatedSettlement,
          } as any,
        },
      });

      return res.json(analysis);
    } catch (error) {
      console.error('Analyze claim error:', error);
      return res.status(500).json({ error: 'Failed to analyze claim' });
    }
  }

  async updateClaimStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, approvedAmount, processingNotes } = req.body;

      const claim = await prisma.claim.update({
        where: { id },
        data: {
          status,
          approvedAmount,
          processingNotes,
          settledAt: status === 'PAID' ? new Date() : undefined,
        },
        include: {
          policy: {
            include: {
              product: true,
            },
          },
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      return res.json(claim);
    } catch (error) {
      console.error('Update claim status error:', error);
      return res.status(500).json({ error: 'Failed to update claim status' });
    }
  }

  private async analyzeClaimAsync(claimId: string) {
    try {
      const analysis = await claimsAnalysisService.analyzeClaim(claimId);

      await prisma.claim.update({
        where: { id: claimId },
        data: {
          aiAnalysis: analysis as any,
          aiRecommendation: {
            action: analysis.recommendedAction,
            estimatedSettlement: analysis.estimatedSettlement,
          } as any,
          status: analysis.fraudRisk === 'HIGH' ? 'UNDER_REVIEW' : 'UNDER_REVIEW',
        },
      });
    } catch (error) {
      console.error('Async claim analysis error:', error);
    }
  }
}

export const claimsController = new ClaimsController();
