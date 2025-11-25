import { Response } from 'express';
import { prisma } from '@insurance/database';
import { AuthRequest } from '../middleware/auth';
import { policyRecommendationService } from '@insurance/ai-services';
import type { CreateQuoteInput } from '@insurance/types';

export class QuotesController {
  async createQuote(req: AuthRequest<{}, {}, CreateQuoteInput>, res: Response) {
    try {
      const { clientId, productId, coverageAmount, deductible, additionalInfo } = req.body;

      const product = await prisma.insuranceProduct.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate premium (simplified calculation)
      const premium = this.calculatePremium(
        product.basePrice,
        coverageAmount,
        deductible,
        additionalInfo
      );

      // Generate quote number
      const quoteNumber = `QT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Quote valid for 30 days
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const quote = await prisma.quote.create({
        data: {
          quoteNumber,
          clientId,
          productId,
          userId: req.user!.id,
          premium,
          coverageAmount,
          deductible,
          validUntil,
          details: additionalInfo || {},
        },
        include: {
          product: true,
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
        },
      });

      return res.status(201).json(quote);
    } catch (error) {
      console.error('Create quote error:', error);
      return res.status(500).json({ error: 'Failed to create quote' });
    }
  }

  async getQuotes(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      let where: any = {};

      if (req.user!.role === 'CLIENT') {
        const client = await prisma.client.findUnique({
          where: { userId: req.user!.id },
        });
        if (client) {
          where.clientId = client.id;
        }
      }

      const [quotes, total] = await Promise.all([
        prisma.quote.findMany({
          where,
          skip,
          take: limit,
          include: {
            product: true,
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
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.quote.count({ where }),
      ]);

      return res.json({
        data: quotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get quotes error:', error);
      return res.status(500).json({ error: 'Failed to fetch quotes' });
    }
  }

  async getQuote(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          product: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && quote.client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(quote);
    } catch (error) {
      console.error('Get quote error:', error);
      return res.status(500).json({ error: 'Failed to fetch quote' });
    }
  }

  async acceptQuote(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          product: true,
          client: true,
        },
      });

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Check if quote is still valid
      if (new Date() > quote.validUntil) {
        return res.status(400).json({ error: 'Quote has expired' });
      }

      // Create policy from quote
      const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const policy = await prisma.policy.create({
        data: {
          policyNumber,
          clientId: quote.clientId,
          productId: quote.productId,
          premium: quote.premium,
          coverageAmount: quote.coverageAmount,
          deductible: quote.deductible,
          startDate,
          endDate,
          renewalDate: endDate,
          terms: quote.details,
          status: 'DRAFT',
        },
        include: {
          product: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      // Mark quote as accepted
      await prisma.quote.update({
        where: { id },
        data: { isAccepted: true },
      });

      return res.json(policy);
    } catch (error) {
      console.error('Accept quote error:', error);
      return res.status(500).json({ error: 'Failed to accept quote' });
    }
  }

  async compareQuotes(req: AuthRequest, res: Response) {
    try {
      const { clientId, insuranceType, coverageAmount, deductible } = req.body;

      const products = await prisma.insuranceProduct.findMany({
        where: {
          type: insuranceType,
          isActive: true,
        },
      });

      const quotes = products.map(product => ({
        product,
        premium: this.calculatePremium(product.basePrice, coverageAmount, deductible),
        coverageAmount,
        deductible,
      }));

      // Sort by premium
      quotes.sort((a, b) => a.premium - b.premium);

      return res.json(quotes);
    } catch (error) {
      console.error('Compare quotes error:', error);
      return res.status(500).json({ error: 'Failed to compare quotes' });
    }
  }

  async getAIRecommendations(req: AuthRequest, res: Response) {
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
      console.error('Get AI recommendations error:', error);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  private calculatePremium(
    basePrice: number,
    coverageAmount: number,
    deductible: number,
    additionalInfo?: any
  ): number {
    // Simplified premium calculation
    let premium = basePrice;

    // Adjust for coverage amount (per $100k of coverage)
    const coverageMultiplier = coverageAmount / 100000;
    premium = premium * (0.5 + coverageMultiplier * 0.5);

    // Adjust for deductible (higher deductible = lower premium)
    const deductibleDiscount = Math.min(deductible / 10000, 0.3);
    premium = premium * (1 - deductibleDiscount);

    return Math.round(premium * 100) / 100;
  }
}

export const quotesController = new QuotesController();
