import { openai, MODELS } from './openai-client';
import type { RiskAssessmentInput, RiskAssessmentResult } from '@insurance/types';

export class RiskAssessmentService {
  async assessRisk(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    const prompt = this.buildRiskAssessmentPrompt(input);

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: [
        {
          role: 'system',
          content: `You are an expert insurance risk analyst. Analyze the provided information and return a JSON object with:
- riskLevel: LOW, MEDIUM, HIGH, or VERY_HIGH
- riskScore: number between 0-100
- factors: array of risk factors with impact, weight, and description
- recommendations: array of actionable recommendations
- confidence: confidence score 0-1

Be thorough, analytical, and conservative in your assessment.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as RiskAssessmentResult;
  }

  private buildRiskAssessmentPrompt(input: RiskAssessmentInput): string {
    const { assessmentType, data } = input;

    return `
Perform a ${assessmentType} risk assessment with the following information:

Client Data:
${JSON.stringify(data, null, 2)}

Analyze all relevant risk factors including:
- Demographic factors (age, location, occupation)
- Historical data (claims history, credit score, driving record)
- Property/Asset characteristics
- External risk factors (crime rates, natural disaster zones, etc.)
- Behavioral indicators

Provide a comprehensive risk assessment with specific recommendations.
    `.trim();
  }

  async assessAutoInsuranceRisk(data: {
    age: number;
    drivingHistory: any[];
    vehicle: any;
    location: string;
    annualMileage: number;
  }): Promise<RiskAssessmentResult> {
    return this.assessRisk({
      clientId: '',
      assessmentType: 'Auto Insurance',
      data,
    });
  }

  async assessHomeInsuranceRisk(data: {
    propertyAge: number;
    propertyValue: number;
    location: string;
    construction: string;
    securityFeatures: string[];
    claimsHistory: any[];
  }): Promise<RiskAssessmentResult> {
    return this.assessRisk({
      clientId: '',
      assessmentType: 'Home Insurance',
      data,
    });
  }

  async assessLifeInsuranceRisk(data: {
    age: number;
    health: any;
    lifestyle: any;
    occupation: string;
    familyHistory: any;
  }): Promise<RiskAssessmentResult> {
    return this.assessRisk({
      clientId: '',
      assessmentType: 'Life Insurance',
      data,
    });
  }
}

export const riskAssessmentService = new RiskAssessmentService();
