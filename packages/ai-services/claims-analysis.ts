import { openai, MODELS } from './openai-client';
import { prisma } from '@insurance/database';
import type { ClaimAnalysisResult } from '@insurance/types';

export class ClaimsAnalysisService {
  async analyzeClaim(claimId: string): Promise<ClaimAnalysisResult> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        policy: {
          include: {
            product: true,
          },
        },
        client: {
          include: {
            user: true,
            claims: true,
          },
        },
        documents: true,
      },
    });

    if (!claim) {
      throw new Error('Claim not found');
    }

    const prompt = this.buildClaimAnalysisPrompt(claim);

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance claims analyst with expertise in fraud detection. Analyze the claim and return a JSON object with:
- fraudRisk: LOW, MEDIUM, or HIGH
- fraudScore: number 0-100
- validationStatus: VALID, QUESTIONABLE, or INVALID
- flags: array of suspicious indicators with type, severity, and description
- recommendedAction: what action should be taken
- estimatedSettlement: fair settlement amount based on policy and claim details

Be thorough and identify any red flags or inconsistencies.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ClaimAnalysisResult;
  }

  private buildClaimAnalysisPrompt(claim: any): string {
    const daysSincePolicyStart = Math.floor(
      (new Date(claim.incidentDate).getTime() - new Date(claim.policy.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return `
Claim Information:
- Claim Number: ${claim.claimNumber}
- Claim Amount: $${claim.claimAmount}
- Incident Date: ${claim.incidentDate}
- Reported Date: ${claim.reportedDate}
- Description: ${claim.description}

Policy Information:
- Policy Number: ${claim.policy.policyNumber}
- Product: ${claim.policy.product.name}
- Coverage Amount: $${claim.policy.coverageAmount}
- Deductible: $${claim.policy.deductible}
- Premium: $${claim.policy.premium}
- Policy Start: ${claim.policy.startDate}
- Days Since Policy Start: ${daysSincePolicyStart}

Client History:
- Total Claims: ${claim.client.claims.length}
- Previous Claims: ${claim.client.claims.filter((c: any) => c.id !== claim.id).length}

Supporting Documents:
${claim.documents.map((d: any) => `- ${d.fileName} (${d.category})`).join('\n') || 'None uploaded'}

Analyze this claim for:
1. Fraud indicators (timing, amount, frequency, patterns)
2. Policy coverage validation
3. Claim amount reasonableness
4. Documentation completeness
5. Historical patterns
6. Red flags or inconsistencies

Provide a comprehensive analysis with specific recommendations.
    `.trim();
  }

  async detectFraudPatterns(clientId: string): Promise<{
    riskLevel: string;
    patterns: string[];
    score: number;
  }> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        claims: {
          include: {
            policy: true,
          },
        },
        policies: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const prompt = `
Analyze this client's insurance history for fraud patterns:

Claims History:
${client.claims.map((c: any) => `
- Claim ${c.claimNumber}: $${c.claimAmount} on ${c.incidentDate}
  Status: ${c.status}
  Policy: ${c.policy.policyNumber}
  Days after policy start: ${Math.floor((new Date(c.incidentDate).getTime() - new Date(c.policy.startDate).getTime()) / (1000 * 60 * 60 * 24))}
`).join('\n')}

Total Policies: ${client.policies.length}
Total Claims: ${client.claims.length}

Identify any suspicious patterns and return JSON with:
- riskLevel: LOW, MEDIUM, HIGH
- patterns: array of identified patterns
- score: fraud risk score 0-100
    `;

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: [
        {
          role: 'system',
          content: 'You are a fraud detection expert. Analyze the data and identify suspicious patterns.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}

export const claimsAnalysisService = new ClaimsAnalysisService();
