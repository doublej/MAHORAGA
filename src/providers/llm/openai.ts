import { createError, ErrorCode } from "../../lib/errors";
import type { LLMProvider, CompletionParams, CompletionResult } from "../types";

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
  output?: OpenAIResponsesOutputItem[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

const REASONING_PREFIXES = ["o1", "o3", "o4", "gpt-5"];
const RESPONSES_PREFIXES = ["o1", "o3", "o4", "gpt-5", "gpt-4.1", "gpt-4o", "gpt-5.1-codex"];

function isReasoningModel(model: string): boolean {
  return REASONING_PREFIXES.some(
    (p) => model === p || model.startsWith(`${p}-`)
  );
}

function shouldUseResponses(model: string): boolean {
  return RESPONSES_PREFIXES.some(
    (p) => model === p || model.startsWith(`${p}-`)
  );
}

function mapRole(role: "system" | "user" | "assistant", reasoning: boolean): "developer" | "system" | "user" | "assistant" {
  if (reasoning && role === "system") {
    return "developer";
  }
  return role;
}

function buildResponsesInput(
  messages: CompletionParams["messages"],
  reasoning: boolean
): Array<{ role: string; content: Array<{ type: "input_text"; text: string }> }> {
  return messages.map((message) => ({
    role: mapRole(message.role, reasoning),
    content: [{ type: "input_text", text: message.content }],
  }));
}

function extractResponsesText(data: OpenAIResponsesResponse): string {
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const content of item.content) {
        if (content.type === "output_text" && typeof content.text === "string") {
          parts.push(content.text);
        }
      }
      continue;
    }
    if (item.type === "output_text" && typeof item.text === "string") {
      parts.push(item.text);
    }
  }
  return parts.join("");
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

    if (!reasoning) {
      body.temperature = params.temperature ?? 0.7;
    } else if (params.reasoning_effort) {
      body.reasoning = { effort: params.reasoning_effort };
    }

    if (params.response_format?.type === "json_object") {
      body.text = { format: { type: "json_object" } };
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
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

    const data = (await response.json()) as OpenAIChatResponse;

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
