import { Response } from 'express';
import { prisma } from '@insurance/database';
import { AuthRequest } from '../middleware/auth';
import type { CreateClientInput } from '@insurance/types';

export class ClientsController {
  async createClient(req: AuthRequest<{}, {}, CreateClientInput>, res: Response) {
    try {
      const userId = req.body.userId || req.user!.id;

      // Check if client profile already exists
      const existing = await prisma.client.findUnique({
        where: { userId },
      });

      if (existing) {
        return res.status(400).json({ error: 'Client profile already exists' });
      }

      const client = await prisma.client.create({
        data: {
          userId,
          dateOfBirth: new Date(req.body.dateOfBirth),
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          country: req.body.country || 'USA',
          occupation: req.body.occupation,
          annualIncome: req.body.annualIncome,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json(client);
    } catch (error) {
      console.error('Create client error:', error);
      return res.status(500).json({ error: 'Failed to create client profile' });
    }
  }

  async getClients(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where = req.user!.role === 'BROKER'
        ? {
            brokers: {
              some: {
                brokerId: req.user!.id,
              },
            },
          }
        : {};

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            policies: true,
            claims: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.client.count({ where }),
      ]);

      return res.json({
        data: clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get clients error:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  async getClient(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
          policies: {
            include: {
              product: true,
            },
          },
          claims: true,
          riskAssessments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          quotes: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(client);
    } catch (error) {
      console.error('Get client error:', error);
      return res.status(500).json({ error: 'Failed to fetch client' });
    }
  }

  async updateClient(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Authorization check
      if (req.user!.role === 'CLIENT' && client.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await prisma.client.update({
        where: { id },
        data: req.body,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error('Update client error:', error);
      return res.status(500).json({ error: 'Failed to update client' });
    }
  }
}

export const clientsController = new ClientsController();
