import { createError, ErrorCode } from '../../lib/errors';
import type { CompletionParams, CompletionResult, LLMProvider } from '../types';

export interface GeminiConfig {
  /** Google AI Studio API key (generativelanguage.googleapis.com) */
  apiKey?: string;
  /** Vertex AI: GCP project id */
  project?: string;
  /** Vertex AI: region, e.g. "us-central1" */
  location?: string;
  /** Vertex AI: service account email */
  serviceAccountEmail?: string;
  /** Vertex AI: service account private key (PEM, or base64-encoded PEM) */
  serviceAccountPrivateKey?: string;
  model?: string;
}

interface GeminiPart {
  text?: string;
  [key: string]: unknown;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiGenerateRequest {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    thinkingConfig?: { thinkingBudget: number };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string; status?: string };
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return (
    msg.includes('empty content') ||
    msg.includes('rate limit') ||
    msg.includes('timeout') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('unavailable')
  );
}

function decodePrivateKey(pemOrBase64: string): string {
  const trimmed = pemOrBase64.trim();
  if (trimmed.includes('-----BEGIN')) return trimmed;
  try {
    return Buffer.from(trimmed, 'base64').toString('utf8');
  } catch {
    return trimmed;
  }
}

function pemToDer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(privateKeyPem: string, claims: Record<string, unknown>): Promise<string> {
  const pem = decodePrivateKey(privateKeyPem);
  const keyData = pemToDer(pem);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iat: now, exp: now + 3600, ...claims };

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function buildRequest(params: CompletionParams): GeminiGenerateRequest {
  const systemMessages = params.messages.filter(m => m.role === 'system');
  const conversation = params.messages.filter(m => m.role !== 'system');

  const contents: GeminiContent[] = conversation.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  const request: GeminiGenerateRequest = {
    contents,
    generationConfig: {
      maxOutputTokens: params.max_tokens ?? 1024,
    },
  };

  if (systemMessages.length > 0) {
    request.systemInstruction = {
      parts: [{ text: systemMessages.map(m => m.content).join('\n\n') }],
    };
  }

  if (params.temperature !== undefined) {
    request.generationConfig.temperature = params.temperature;
  }

  if (params.response_format?.type === 'json_object') {
    request.generationConfig.responseMimeType = 'application/json';
  }

  if (params.thinking === false) {
    request.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return request;
}

function extractText(data: GeminiGenerateResponse): string {
  if (data.error) {
    throw createError(
      ErrorCode.PROVIDER_ERROR,
      `Gemini API error: ${data.error.message || data.error.status || 'unknown'}`
    );
  }

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason && !['STOP', 'MAX_TOKENS'].includes(finishReason)) {
    throw createError(ErrorCode.PROVIDER_ERROR, `Gemini API: finish_reason=${finishReason}`);
  }

  const text = (candidate?.content?.parts ?? [])
    .map(part => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw createError(ErrorCode.PROVIDER_ERROR, 'Gemini API returned empty content');
  }

  return text;
}

export class GeminiProvider implements LLMProvider {
  private apiKey?: string;
  private project?: string;
  private location: string;
  private serviceAccountEmail?: string;
  private serviceAccountPrivateKey?: string;
  private model: string;
  private accessToken: string | null = null;
  private accessTokenExpiry: number = 0;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.project = config.project;
    this.location = (config.location ?? 'us-central1').trim();
    this.serviceAccountEmail = config.serviceAccountEmail;
    this.serviceAccountPrivateKey = config.serviceAccountPrivateKey;
    this.model = config.model ?? 'gemini-2.5-flash';
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const model = params.model ?? this.model;
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.generateContent(model, params);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryableError(error)) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }
    }

    throw lastError;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessTokenExpiry - 60_000) {
      return this.accessToken;
    }

    if (!this.serviceAccountEmail || !this.serviceAccountPrivateKey) {
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        'Gemini Vertex AI requires service account credentials'
      );
    }

    const jwt = await signJwt(this.serviceAccountPrivateKey, {
      iss: this.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        `Google OAuth token error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      throw createError(ErrorCode.PROVIDER_ERROR, 'Google OAuth returned no access token');
    }

    this.accessToken = data.access_token;
    this.accessTokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
    return this.accessToken;
  }

  private async generateContent(
    model: string,
    params: CompletionParams
  ): Promise<CompletionResult> {
    const body = buildRequest(params);

    let url: string;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      headers['x-goog-api-key'] = this.apiKey;
    } else {
      if (!this.project) {
        throw createError(ErrorCode.PROVIDER_ERROR, 'Gemini provider is not configured');
      }
      const token = await this.getAccessToken();
      url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.project}/locations/${this.location}/publishers/google/models/${model}:generateContent`;
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw createError(
        ErrorCode.PROVIDER_ERROR,
        `Gemini API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const usage = data.usageMetadata ?? {};
    const content = extractText(data);

    return {
      content,
      usage: {
        prompt_tokens: usage.promptTokenCount ?? 0,
        completion_tokens: usage.candidatesTokenCount ?? 0,
        total_tokens: usage.totalTokenCount ?? 0,
      },
    };
  }
}

export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}