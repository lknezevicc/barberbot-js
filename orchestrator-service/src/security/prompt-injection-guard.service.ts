import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptInjectionGuardService {
  private readonly maxMessageLength = Number(process.env.MAX_USER_MESSAGE_LENGTH ?? 100);

  private readonly patterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|earlier|system)\s+instructions/i,
    /zanemari\s+(sve\s+)?(prethodne|ranije|sistemske)\s+upute/i,
    /reveal\s+(system\s+prompt|hidden\s+prompt|developer\s+message)/i,
    /(print|show|otkrij|prikaži).*(prompt|upute|system|developer)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /ti\s+si\s+sada\s+/i,
    /act\s+as\s+/i,
    /pretvaraj\s+se\s+da\s+si/i,
    /<\/?(system|assistant|developer)>/i,
    /```[\s\S]*```/i,
    /base64|rot13|decode\s+this|dešifriraj/i,
  ];

  shouldReject(message: string): boolean {
    if (!message) {
      return false;
    }

    if (message.length > this.maxMessageLength) {
      return true;
    }

    return this.patterns.some((pattern) => pattern.test(message));
  }

  rejectionMessage(): string {
    return 'Ne mogu obraditi taj format poruke. Napiši zahtjev za rezervaciju termina (usluga, datum, vrijeme, barber).';
  }
}
