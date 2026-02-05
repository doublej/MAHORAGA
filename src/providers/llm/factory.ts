import type { LLMProvider } from '../types';
import type { Env } from '../../env.d';
import { createOpenAIProvider } from './openai';

export function createLLMProvider(env: Env): LLMProvider | null {
  if (env.FEATURE_LLM_RESEARCH !== 'true') return null;

  if (!env.OPENAI_API_KEY) return null;

  return createOpenAIProvider({ apiKey: env.OPENAI_API_KEY, model: env.LLM_MODEL });
}
