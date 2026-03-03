import { Injectable, Logger } from '@nestjs/common';

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class OpenAiChatClient {
  private readonly logger = new Logger(OpenAiChatClient.name);

  async complete(systemPrompt: string, userMessage: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const httpReferer = process.env.OPENAI_HTTP_REFERER;
    const xTitle = process.env.OPENAI_X_TITLE;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (httpReferer) {
      headers['HTTP-Referer'] = httpReferer;
    }

    if (xTitle) {
      headers['X-Title'] = xTitle;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`OpenAI call failed (${response.status}): ${body}`);
      return null;
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || null;
  }
}
