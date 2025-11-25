import { openai, MODELS } from './openai-client';
import { prisma } from '@insurance/database';
import type { ChatMessage, ChatResponse } from '@insurance/types';

export class ChatbotService {
  async chat(
    userId: string,
    sessionId: string,
    message: string
  ): Promise<ChatResponse> {
    // Get or create session
    let session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            clientProfile: {
              include: {
                policies: true,
                claims: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          id: sessionId,
          userId,
          messages: [],
        },
        include: {
          user: {
            include: {
              clientProfile: {
                include: {
                  policies: true,
                  claims: true,
                },
              },
            },
          },
        },
      });
    }

    const messages = session.messages as ChatMessage[];
    const context = this.buildContext(session.user);

    const chatMessages: any[] = [
      {
        role: 'system',
        content: this.getSystemPrompt(context),
      },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    const response = await openai.chat.completions.create({
      model: MODELS.GPT4,
      messages: chatMessages,
      temperature: 0.7,
      functions: [
        {
          name: 'get_policy_details',
          description: 'Get details about a specific policy',
          parameters: {
            type: 'object',
            properties: {
              policyNumber: {
                type: 'string',
                description: 'The policy number',
              },
            },
            required: ['policyNumber'],
          },
        },
        {
          name: 'get_claim_status',
          description: 'Get the status of a claim',
          parameters: {
            type: 'object',
            properties: {
              claimNumber: {
                type: 'string',
                description: 'The claim number',
              },
            },
            required: ['claimNumber'],
          },
        },
        {
          name: 'get_quote',
          description: 'Get an insurance quote',
          parameters: {
            type: 'object',
            properties: {
              insuranceType: {
                type: 'string',
                enum: ['AUTO', 'HOME', 'LIFE', 'HEALTH'],
              },
              coverageAmount: {
                type: 'number',
              },
            },
            required: ['insuranceType'],
          },
        },
      ],
    });

    const assistantMessage = response.choices[0].message;
    let responseText = assistantMessage.content || '';
    const actions: any[] = [];

    // Handle function calls
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');

      actions.push({
        type: functionName,
        label: this.getFunctionLabel(functionName),
        data: functionArgs,
      });

      responseText = await this.executeFunctionCall(functionName, functionArgs, session.user);
    }

    // Update session
    const updatedMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      },
      {
        role: 'assistant' as const,
        content: responseText,
        timestamp: new Date(),
      },
    ];

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messages: updatedMessages as any,
        updatedAt: new Date(),
      },
    });

    return {
      message: responseText,
      suggestions: this.generateSuggestions(session.user),
      actions,
    };
  }

  private getSystemPrompt(context: string): string {
    return `You are a helpful AI insurance assistant. You help customers with:
- Policy information and coverage questions
- Claims status and filing
- Quote requests
- General insurance advice
- Account management

User Context:
${context}

Be friendly, professional, and helpful. If you need to perform actions like looking up policies or claims, use the available functions.
Always prioritize accuracy and customer satisfaction.`;
  }

  private buildContext(user: any): string {
    const client = user.clientProfile;
    if (!client) {
      return `User: ${user.firstName} ${user.lastName}\nRole: ${user.role}`;
    }

    return `
User: ${user.firstName} ${user.lastName}
Role: ${user.role}
Policies: ${client.policies.length} active
Recent Claims: ${client.claims.filter((c: any) => c.status !== 'PAID').length}
Location: ${client.city}, ${client.state}
    `.trim();
  }

  private getFunctionLabel(functionName: string): string {
    const labels: Record<string, string> = {
      get_policy_details: 'View Policy Details',
      get_claim_status: 'Check Claim Status',
      get_quote: 'Get Quote',
    };
    return labels[functionName] || functionName;
  }

  private async executeFunctionCall(
    functionName: string,
    args: any,
    user: any
  ): Promise<string> {
    switch (functionName) {
      case 'get_policy_details':
        return this.getPolicyDetails(args.policyNumber, user);
      case 'get_claim_status':
        return this.getClaimStatus(args.claimNumber, user);
      case 'get_quote':
        return this.getQuoteEstimate(args.insuranceType, args.coverageAmount, user);
      default:
        return 'Function not implemented';
    }
  }

  private async getPolicyDetails(policyNumber: string, user: any): Promise<string> {
    const policy = await prisma.policy.findFirst({
      where: {
        policyNumber,
        client: {
          userId: user.id,
        },
      },
      include: {
        product: true,
      },
    });

    if (!policy) {
      return 'Policy not found or you do not have access to it.';
    }

    return `
Policy ${policy.policyNumber}:
- Product: ${policy.product.name}
- Status: ${policy.status}
- Premium: $${policy.premium}/month
- Coverage: $${policy.coverageAmount}
- Deductible: $${policy.deductible}
- Period: ${policy.startDate.toLocaleDateString()} to ${policy.endDate.toLocaleDateString()}
    `.trim();
  }

  private async getClaimStatus(claimNumber: string, user: any): Promise<string> {
    const claim = await prisma.claim.findFirst({
      where: {
        claimNumber,
        client: {
          userId: user.id,
        },
      },
      include: {
        policy: true,
      },
    });

    if (!claim) {
      return 'Claim not found or you do not have access to it.';
    }

    return `
Claim ${claim.claimNumber}:
- Status: ${claim.status}
- Amount: $${claim.claimAmount}
${claim.approvedAmount ? `- Approved Amount: $${claim.approvedAmount}` : ''}
- Incident Date: ${claim.incidentDate.toLocaleDateString()}
- Reported: ${claim.reportedDate.toLocaleDateString()}
- Policy: ${claim.policy.policyNumber}
    `.trim();
  }

  private async getQuoteEstimate(
    insuranceType: string,
    coverageAmount: number,
    user: any
  ): Promise<string> {
    // Simplified quote estimation
    const baseRates: Record<string, number> = {
      AUTO: 150,
      HOME: 120,
      LIFE: 80,
      HEALTH: 450,
    };

    const baseRate = baseRates[insuranceType] || 100;
    const coverageMultiplier = coverageAmount ? (coverageAmount / 100000) * 0.1 : 1;
    const estimatedPremium = Math.round(baseRate * coverageMultiplier);

    return `Based on your profile, estimated ${insuranceType.toLowerCase()} insurance premium: $${estimatedPremium}/month for $${coverageAmount || 100000} coverage. This is an estimate - for an accurate quote, I can connect you with a broker.`;
  }

  private generateSuggestions(user: any): string[] {
    const suggestions = ['How can I file a claim?', 'What does my policy cover?'];

    if (user.clientProfile?.policies.length > 0) {
      suggestions.push('Show my active policies');
    }

    if (user.clientProfile?.claims.length > 0) {
      suggestions.push('Check my claim status');
    }

    return suggestions;
  }

  async createSession(userId: string): Promise<string> {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        messages: [],
      },
    });

    return session.id;
  }

  async getSessions(userId: string): Promise<any[]> {
    return prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export const chatbotService = new ChatbotService();
