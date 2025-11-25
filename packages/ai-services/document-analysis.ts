import { openai, MODELS } from './openai-client';
import type { DocumentAnalysisResult } from '@insurance/types';

export class DocumentAnalysisService {
  async analyzeDocument(
    documentType: string,
    documentText: string,
    metadata?: Record<string, any>
  ): Promise<DocumentAnalysisResult> {
    const prompt = this.buildDocumentAnalysisPrompt(documentType, documentText, metadata);

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: [
        {
          role: 'system',
          content: `You are an expert document analyst specializing in insurance documents. Analyze the document and return a JSON object with:
- documentType: identified document type
- confidence: confidence score 0-1
- extractedData: key-value pairs of extracted information
- validationResults: array of validation results for each field
- summary: brief summary of the document

Extract all relevant information accurately.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as DocumentAnalysisResult;
  }

  private buildDocumentAnalysisPrompt(
    documentType: string,
    documentText: string,
    metadata?: Record<string, any>
  ): string {
    return `
Document Type: ${documentType}
${metadata ? `Metadata: ${JSON.stringify(metadata, null, 2)}` : ''}

Document Content:
${documentText}

Please analyze this document and extract:
1. All personal information (names, addresses, dates, IDs)
2. Policy/claim details (numbers, dates, amounts)
3. Financial information
4. Key terms and conditions
5. Signatures and dates
6. Any special clauses or notes

Validate the extracted information and identify any missing or inconsistent data.
    `.trim();
  }

  async analyzeDriversLicense(imageBase64: string): Promise<DocumentAnalysisResult> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract all information from this driver\'s license and return as JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract: full name, license number, date of birth, address, expiration date, issue date, state.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const extracted = JSON.parse(response.choices[0].message.content || '{}');

    return {
      documentType: 'DRIVERS_LICENSE',
      confidence: 0.95,
      extractedData: extracted,
      validationResults: this.validateDriversLicense(extracted),
      summary: `Driver's license for ${extracted.fullName || 'Unknown'}`,
    };
  }

  async analyzeInsuranceCard(imageBase64: string): Promise<DocumentAnalysisResult> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract all information from this insurance card and return as JSON.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract: policy number, insured name, carrier, effective date, expiration date, coverage types, VIN (if auto insurance).',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const extracted = JSON.parse(response.choices[0].message.content || '{}');

    return {
      documentType: 'INSURANCE_CARD',
      confidence: 0.92,
      extractedData: extracted,
      validationResults: this.validateInsuranceCard(extracted),
      summary: `Insurance card - Policy ${extracted.policyNumber || 'Unknown'}`,
    };
  }

  async analyzeClaimForm(documentText: string): Promise<DocumentAnalysisResult> {
    return this.analyzeDocument('CLAIM_FORM', documentText);
  }

  async analyzePolicyDocument(documentText: string): Promise<DocumentAnalysisResult> {
    return this.analyzeDocument('POLICY_DOCUMENT', documentText);
  }

  private validateDriversLicense(data: any): any[] {
    const validations = [];

    validations.push({
      field: 'fullName',
      isValid: !!data.fullName,
      message: data.fullName ? undefined : 'Name is required',
    });

    validations.push({
      field: 'licenseNumber',
      isValid: !!data.licenseNumber,
      message: data.licenseNumber ? undefined : 'License number is required',
    });

    validations.push({
      field: 'dateOfBirth',
      isValid: !!data.dateOfBirth,
      message: data.dateOfBirth ? undefined : 'Date of birth is required',
    });

    if (data.expirationDate) {
      const isExpired = new Date(data.expirationDate) < new Date();
      validations.push({
        field: 'expirationDate',
        isValid: !isExpired,
        message: isExpired ? 'License is expired' : undefined,
      });
    }

    return validations;
  }

  private validateInsuranceCard(data: any): any[] {
    const validations = [];

    validations.push({
      field: 'policyNumber',
      isValid: !!data.policyNumber,
      message: data.policyNumber ? undefined : 'Policy number is required',
    });

    validations.push({
      field: 'carrier',
      isValid: !!data.carrier,
      message: data.carrier ? undefined : 'Carrier is required',
    });

    if (data.expirationDate) {
      const isExpired = new Date(data.expirationDate) < new Date();
      validations.push({
        field: 'expirationDate',
        isValid: !isExpired,
        message: isExpired ? 'Policy is expired' : undefined,
      });
    }

    return validations;
  }
}

export const documentAnalysisService = new DocumentAnalysisService();
