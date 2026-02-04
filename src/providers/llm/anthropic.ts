import Anthropic from "@anthropic-ai/sdk";
import { createError, ErrorCode } from "../../lib/errors";
import type { LLMProvider, CompletionParams, CompletionResult } from "../types";

export interface ClaudeConfig {
  apiKey: string;
  model?: string;
}

type AnthropicTool = Anthropic.Messages.Tool;
type AnthropicMessage = Anthropic.Messages.MessageParam;

export class ClaudeProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: ClaudeConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model ?? "claude-haiku-4-20250414";
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const systemParts: string[] = [];
    const messages: AnthropicMessage[] = [];

    for (const msg of params.messages) {
      if (msg.role === "system") {
        systemParts.push(msg.content);
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    const tools = this.buildTools(params);

    const response = await this.client.messages.create({
      model: params.model ?? this.model,
      max_tokens: params.max_tokens ?? 1024,
      temperature: params.temperature ?? 0.7,
      ...(systemParts.length > 0 && { system: systemParts.join("\n\n") }),
      messages,
      ...(tools.length > 0 && { tools }),
    }).catch((err) => {
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        `Anthropic API error: ${err instanceof Error ? err.message : String(err)}`
      );
    });

    const content = this.extractContent(response);

    return {
      content,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  private buildTools(params: CompletionParams): AnthropicTool[] {
    if (params.response_format?.type !== "json_object") return [];

    return [{
      name: "respond_json",
      description: "Respond with structured JSON output",
      input_schema: {
        type: "object" as const,
        properties: {},
        additionalProperties: true,
      },
    }];
  }

  private extractContent(response: Anthropic.Messages.Message): string {
    for (const block of response.content) {
      if (block.type === "tool_use") {
        return JSON.stringify(block.input);
      }
    }

    for (const block of response.content) {
      if (block.type === "text") return block.text;
    }

    throw createError(
      ErrorCode.PROVIDER_ERROR,
      "LLM response contained no valid content blocks"
    );
  }
}

export function createClaudeProvider(config: ClaudeConfig): ClaudeProvider {
  return new ClaudeProvider(config);
}
