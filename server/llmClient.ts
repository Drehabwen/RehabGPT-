/**
 * LLM Client — DeepSeek-compatible API (OpenAI SDK format)
 *
 * Supports:
 * - Non-streaming chat completions (POST /v1/chat/completions)
 * - Streaming chat completions (SSE)
 *
 * Configure via environment variables:
 * - DEEPSEEK_API_KEY  (required)
 * - DEEPSEEK_BASE_URL (default: https://api.deepseek.com)
 * - DEEPSEEK_MODEL    (default: deepseek-chat)
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  finishReason: string;
}

/**
 * Non-streaming chat completion.
 */
export async function chatCompletion(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<LLMResponse> {
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string }; finish_reason: string }>;
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    finishReason: data.choices[0]?.finish_reason ?? 'stop',
  };
}

/**
 * Streaming chat completion — yields content tokens via async generator.
 */
export async function* streamChatCompletion(
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number },
): AsyncGenerator<string> {
  if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM stream API error ${res.status}: ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip unparseable chunks
      }
    }
  }
}

/** Check if the LLM API is configured and reachable. */
export function isConfigured(): boolean {
  return API_KEY.length > 0;
}
