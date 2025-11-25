import { Response } from 'express';
import { prisma } from '@insurance/database';
import { AuthRequest } from '../middleware/auth';

export class ProductsController {
  async createProduct(req: AuthRequest, res: Response) {
    try {
      const {
        name,
        type,
        carrier,
        description,
        basePrice,
        coverageDetails,
        eligibility,
        features,
      } = req.body;

      const product = await prisma.insuranceProduct.create({
        data: {
          name,
          type,
          carrier,
          description,
          basePrice,
          coverageDetails,
          eligibility,
          features,
        },
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  async getProducts(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const type = req.query.type as string;
      const carrier = req.query.carrier as string;

      const where: any = { isActive: true };

      if (type) {
        where.type = type;
      }

      if (carrier) {
        where.carrier = carrier;
      }

      const [products, total] = await Promise.all([
        prisma.insuranceProduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.insuranceProduct.count({ where }),
      ]);

      return res.json({
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  async getProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.insuranceProduct.findUnique({
        where: { id },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      return res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      return res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.insuranceProduct.update({
        where: { id },
        data: req.body,
      });

      return res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  async deactivateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.insuranceProduct.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json(product);
    } catch (error) {
      console.error('Deactivate product error:', error);
      return res.status(500).json({ error: 'Failed to deactivate product' });
    }
  }
}

export const productsController = new ProductsController();
