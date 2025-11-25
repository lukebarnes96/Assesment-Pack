import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['BROKER', 'CLIENT']).optional(),
  phone: z.string().optional(),
});

// Client Schemas
export const createClientSchema = z.object({
  userId: z.string().optional(),
  dateOfBirth: z.string().or(z.date()),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string().default('USA'),
  occupation: z.string().optional(),
  annualIncome: z.number().optional(),
});

// Quote Schemas
export const createQuoteSchema = z.object({
  clientId: z.string(),
  productId: z.string(),
  coverageAmount: z.number().positive(),
  deductible: z.number().positive(),
  additionalInfo: z.record(z.any()).optional(),
});

// Claim Schemas
export const createClaimSchema = z.object({
  policyId: z.string(),
  incidentDate: z.string().or(z.date()),
  claimAmount: z.number().positive(),
  description: z.string(),
});

// AI Service Types
export interface RiskAssessmentInput {
  clientId: string;
  assessmentType: string;
  data: {
    age?: number;
    occupation?: string;
    location?: string;
    history?: any[];
    assets?: any[];
    [key: string]: any;
  };
}

export interface RiskAssessmentResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  riskScore: number;
  factors: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
  recommendations: string[];
  confidence: number;
}

export interface PolicyRecommendationInput {
  clientId: string;
  insuranceType: string;
  budget?: number;
  preferences?: Record<string, any>;
}

export interface PolicyRecommendation {
  productId: string;
  productName: string;
  score: number;
  reasoning: string;
  estimatedPremium: number;
  coverageHighlights: string[];
  pros: string[];
  cons: string[];
}

export interface ClaimAnalysisResult {
  fraudRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudScore: number;
  validationStatus: 'VALID' | 'QUESTIONABLE' | 'INVALID';
  flags: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  recommendedAction: string;
  estimatedSettlement: number;
}

export interface DocumentAnalysisResult {
  documentType: string;
  confidence: number;
  extractedData: Record<string, any>;
  validationResults: {
    field: string;
    isValid: boolean;
    message?: string;
  }[];
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: {
    type: string;
    label: string;
    data: any;
  }[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
