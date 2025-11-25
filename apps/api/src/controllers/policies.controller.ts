import { Response } from 'express';
import { prisma } from '@insurance/database';
import { AuthRequest } from '../middleware/auth';

export class PoliciesController {
  async createPolicy(req: AuthRequest, res: Response) {
    try {
      const {
        clientId,
        productId,
        premium,
        coverageAmount,
        deductible,
        startDate,
        endDate,
        terms,
      } = req.body;

      // Generate policy number
      const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const policy = await prisma.policy.create({
        data: {
          policyNumber,
          clientId,
          productId,
          premium,
          coverageAmount,
          deductible,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          renewalDate: new Date(endDate),
          terms,
          status: 'DRAFT',
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

      return res.status(201).json(policy);
    } catch (error) {
      console.error('Create policy error:', error);
      return res.status(500).json({ error: 'Failed to create policy' });
    }
  }

  async getPolicies(req: AuthRequest, res: Response) {
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

      const [policies, total] = await Promise.all([
        prisma.policy.findMany({
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
        prisma.policy.count({ where }),
      ]);

      return res.json({
        data: policies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get policies error:', error);
      return res.status(500).json({ error: 'Failed to fetch policies' });
    }
  }

  async getPolicy(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const policy = await prisma.policy.findUnique({
        where: { id },
        include: {
          product: true,
          client: {
            include: {
              user: true,
            },
          },
          claims: true,
          documents: true,
        },
      });

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && policy.client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(policy);
    } catch (error) {
      console.error('Get policy error:', error);
      return res.status(500).json({ error: 'Failed to fetch policy' });
    }
  }

  async updatePolicy(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const policy = await prisma.policy.update({
        where: { id },
        data: req.body,
        include: {
          product: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      return res.json(policy);
    } catch (error) {
      console.error('Update policy error:', error);
      return res.status(500).json({ error: 'Failed to update policy' });
    }
  }

  async activatePolicy(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const policy = await prisma.policy.update({
        where: { id },
        data: { status: 'ACTIVE' },
        include: {
          product: true,
          client: {
            include: {
              user: true,
            },
          },
        },
      });

      return res.json(policy);
    } catch (error) {
      console.error('Activate policy error:', error);
      return res.status(500).json({ error: 'Failed to activate policy' });
    }
  }
}

export const policiesController = new PoliciesController();
