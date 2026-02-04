import type { LLMProvider } from '../types';
import type { Env } from '../../env.d';
import { createOpenAIProvider } from './openai';
import { createClaudeProvider } from './anthropic';

type ProviderType = 'openai' | 'claude' | 'auto';

export function createLLMProvider(env: Env): LLMProvider | null {
  if (env.FEATURE_LLM_RESEARCH !== 'true') return null;

  const providerType = (env.LLM_PROVIDER ?? 'auto') as ProviderType;
  const model = env.LLM_MODEL;

  if (providerType === 'claude') {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY required when LLM_PROVIDER=claude');
    }
    return createClaudeProvider({ apiKey: env.ANTHROPIC_API_KEY, model });
  }

  if (providerType === 'openai') {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY required when LLM_PROVIDER=openai');
    }
    return createOpenAIProvider({ apiKey: env.OPENAI_API_KEY, model });
  }

  // Auto mode: prefer Claude, fallback to OpenAI
  if (env.ANTHROPIC_API_KEY) {
    return createClaudeProvider({ apiKey: env.ANTHROPIC_API_KEY, model });
  }
  if (env.OPENAI_API_KEY) {
    return createOpenAIProvider({ apiKey: env.OPENAI_API_KEY, model });
  }

  return null;
}
