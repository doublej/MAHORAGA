import { createError, ErrorCode } from "../../lib/errors";
import type { LLMProvider, CompletionParams, CompletionResult } from "../types";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface OpenAIResponse {
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

const REASONING_PREFIXES = ["o1", "o3", "o4", "gpt-5"];

function isReasoningModel(model: string): boolean {
  return REASONING_PREFIXES.some(
    (p) => model === p || model.startsWith(`${p}-`)
  );
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gpt-5-mini";
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model ?? this.model;
    const reasoning = isReasoningModel(model);

    const messages = reasoning
      ? params.messages.map((m) => ({
          role: m.role === "system" ? "developer" : m.role,
          content: m.content,
        }))
      : params.messages;

    const body: Record<string, unknown> = {
      model,
      messages,
    };

    if (reasoning) {
      body.max_completion_tokens = params.max_tokens ?? 1024;
      if (params.reasoning_effort) {
        body.reasoning_effort = params.reasoning_effort;
      }
    } else {
      body.temperature = params.temperature ?? 0.7;
      body.max_tokens = params.max_tokens ?? 1024;
    }

    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    const data = (await response.json()) as OpenAIResponse;

    const content = data.choices[0]?.message?.content ?? "";

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
