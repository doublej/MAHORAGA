import { createError, ErrorCode } from '../../lib/errors';
import type { LLMProvider, CompletionParams, CompletionResult } from '../types';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface OpenAIChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIResponsesContent {
  type: string;
  text?: string;
}

interface OpenAIResponsesOutputItem {
  type: string;
  role?: string;
  content?: OpenAIResponsesContent[];
  text?: string;
}

interface OpenAIResponsesResponse {
  id: string;
  status?: string; // "completed", "incomplete", "failed", etc.
  output?: OpenAIResponsesOutputItem[];
  output_text?: string;
  error?: { message?: string; code?: string };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

// Reasoning models get special treatment (no temperature, reasoning effort param)
// Note: -mini variants are NOT reasoning models even if they use the Responses API
const REASONING_PREFIXES = ['o1', 'o3', 'o4'];
// gpt-5 reasoning: only the full model, not mini
const REASONING_EXACT = ['gpt-5'];

// Models that use the Responses API (instead of Chat Completions)
const RESPONSES_PREFIXES = ['o1', 'o3', 'o4', 'gpt-5', 'gpt-4.1', 'gpt-4o'];

// Models that don't support temperature on the Responses API
const NO_TEMPERATURE_PREFIXES = ['o1', 'o3', 'o4', 'gpt-5'];

function matchesPrefix(model: string, prefixes: string[]): boolean {
  return prefixes.some(p => model === p || model.startsWith(`${p}-`) || model.startsWith(`${p}.`));
}

function isReasoningModel(model: string): boolean {
  // o1, o3, o4 prefixes are always reasoning
  if (matchesPrefix(model, REASONING_PREFIXES)) return true;
  // gpt-5 exact match only (not gpt-5-mini, gpt-5.1, etc.)
  return REASONING_EXACT.includes(model);
}

function shouldUseResponses(model: string): boolean {
  // Exclude -mini variants from Responses API (use Chat Completions for broader geo support)
  if (model.endsWith('-mini')) return false;
  return matchesPrefix(model, RESPONSES_PREFIXES);
}

function supportsTemperature(model: string): boolean {
  return !matchesPrefix(model, NO_TEMPERATURE_PREFIXES);
}

function mapRole(
  role: 'system' | 'user' | 'assistant',
  reasoning: boolean
): 'developer' | 'system' | 'user' | 'assistant' {
  if (reasoning && role === 'system') {
    return 'developer';
  }
  return role;
}

function buildResponsesInput(
  messages: CompletionParams['messages'],
  reasoning: boolean
): Array<{ role: string; content: Array<{ type: 'input_text' | 'output_text'; text: string }> }> {
  return messages.map(message => {
    const role = mapRole(message.role, reasoning);
    const contentType = message.role === 'assistant' ? 'output_text' : 'input_text';
    return {
      role,
      content: [{ type: contentType, text: message.content }],
    };
  });
}

function extractResponsesText(data: OpenAIResponsesResponse): string {
  // Check response status - only "completed" has valid output
  if (data.status && data.status !== 'completed') {
    const errMsg = data.error?.message || `response status: ${data.status}`;
    throw createError(ErrorCode.PROVIDER_ERROR, `OpenAI Responses API: ${errMsg}`);
  }

  if (data.output_text) return data.output_text;

  for (const item of data.output ?? []) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block.type === 'text' && block.text) return block.text;
      }
    }
  }

  throw createError(ErrorCode.PROVIDER_ERROR, 'OpenAI Responses API returned empty content');
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gpt-5-mini';
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model ?? this.model;
    if (shouldUseResponses(model)) {
      return this.completeWithResponses(model, params);
    }

    return this.completeWithChatCompletions(model, params);
  }

  private async completeWithResponses(
    model: string,
    params: CompletionParams
  ): Promise<CompletionResult> {
    const reasoning = isReasoningModel(model);
    const input = buildResponsesInput(params.messages, reasoning);

    const body: Record<string, unknown> = {
      model,
      input,
      max_output_tokens: params.max_tokens ?? 1024,
    };

    if (supportsTemperature(model)) {
      body.temperature = params.temperature ?? 0.7;
    }
    if (reasoning && params.reasoning_effort) {
      body.reasoning = { effort: params.reasoning_effort };
    }

    if (params.response_format?.type === 'json_object') {
      body.text = { format: { type: 'json_object' } };
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        `OpenAI API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as OpenAIResponsesResponse;
    const usage = data.usage ?? {};
    const content = extractResponsesText(data);

    return {
      content,
      usage: {
        prompt_tokens: usage.input_tokens ?? 0,
        completion_tokens: usage.output_tokens ?? 0,
        total_tokens: usage.total_tokens ?? (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      },
    };
  }

  private async completeWithChatCompletions(
    model: string,
    params: CompletionParams
  ): Promise<CompletionResult> {
    const reasoning = isReasoningModel(model);

    const messages = reasoning
      ? params.messages.map(m => ({
          role: m.role === 'system' ? 'developer' : m.role,
          content: m.content,
        }))
      : params.messages;

    const body: Record<string, unknown> = {
      model,
      messages,
    };

    // gpt-5 family uses max_completion_tokens, older models use max_tokens
    const usesMaxCompletionTokens = reasoning || model.startsWith('gpt-5');
    if (usesMaxCompletionTokens) {
      body.max_completion_tokens = params.max_tokens ?? 1024;
    } else {
      body.max_tokens = params.max_tokens ?? 1024;
    }

    if (reasoning && params.reasoning_effort) {
      body.reasoning_effort = params.reasoning_effort;
    }

    // gpt-5 family doesn't support custom temperature (only default 1)
    if (!reasoning && supportsTemperature(model)) {
      body.temperature = params.temperature ?? 0.7;
    }

    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        `OpenAI API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as OpenAIChatResponse;

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw createError(ErrorCode.PROVIDER_ERROR, 'OpenAI Chat Completions returned empty content');
    }

    return {
      content,
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      },
    };
  }
}

export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
