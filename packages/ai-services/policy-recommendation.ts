import { openai, MODELS } from './openai-client';
import { prisma } from '@insurance/database';
import type { PolicyRecommendationInput, PolicyRecommendation } from '@insurance/types';

export class PolicyRecommendationService {
  async recommendPolicies(
    input: PolicyRecommendationInput
  ): Promise<PolicyRecommendation[]> {
    // Fetch client data
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      include: {
        user: true,
        policies: true,
        riskAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch available products
    const products = await prisma.insuranceProduct.findMany({
      where: {
        type: input.insuranceType as any,
        isActive: true,
      },
    });

    const prompt = this.buildRecommendationPrompt(client, products, input);

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance advisor. Analyze the client profile and available insurance products to recommend the best matches. Return a JSON object with an array of recommendations, each containing:
- productId: the product ID
- productName: product name
- score: match score 0-100
- reasoning: why this product is recommended
- estimatedPremium: estimated monthly premium
- coverageHighlights: key coverage features
- pros: advantages of this product
- cons: potential drawbacks

Rank recommendations by overall suitability.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations":[]}');
    return result.recommendations as PolicyRecommendation[];
  }

  private buildRecommendationPrompt(
    client: any,
    products: any[],
    input: PolicyRecommendationInput
  ): string {
    return `
Client Profile:
- Name: ${client.user.firstName} ${client.user.lastName}
- Age: ${this.calculateAge(client.dateOfBirth)}
- Location: ${client.city}, ${client.state}
- Occupation: ${client.occupation || 'N/A'}
- Annual Income: ${client.annualIncome ? `$${client.annualIncome}` : 'N/A'}
- Risk Profile: ${JSON.stringify(client.riskProfile || {})}
- Current Policies: ${client.policies.length}
${client.riskAssessments[0] ? `- Latest Risk Assessment: ${JSON.stringify(client.riskAssessments[0])}` : ''}

Client Preferences:
- Budget: ${input.budget ? `$${input.budget}/month` : 'Not specified'}
- Preferences: ${JSON.stringify(input.preferences || {})}

Available Products:
${products.map(p => `
- ID: ${p.id}
  Name: ${p.name}
  Carrier: ${p.carrier}
  Base Price: $${p.basePrice}
  Description: ${p.description}
  Coverage: ${JSON.stringify(p.coverageDetails)}
  Features: ${p.features.join(', ')}
`).join('\n')}

Provide detailed recommendations matching the client's needs, risk profile, and budget.
    `.trim();
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

export const policyRecommendationService = new PolicyRecommendationService();
