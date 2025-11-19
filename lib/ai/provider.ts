/**
 * AI Provider adapter using Vercel AI SDK
 * Supports OpenAI, Anthropic, Gemini, and custom providers via baseURL
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type AiProviderType = 'openai' | 'anthropic' | 'google' | 'custom';

export interface AiProviderConfig {
  type: AiProviderType;
  apiKey?: string;
  baseURL?: string;
  model: string;
}

export function getOpenAIClient(config: AiProviderConfig) {
  return createOpenAI({
    apiKey: config.apiKey ?? '',
    baseURL: config.baseURL,
  });
}

export function getAnthropicClient(config: AiProviderConfig) {
  return createAnthropic({
    apiKey: config.apiKey ?? '',
    baseURL: config.baseURL,
  });
}

export function getGoogleClient(config: AiProviderConfig) {
  return createGoogleGenerativeAI({
    apiKey: config.apiKey ?? '',
  });
}

export function getAIClient(config: AiProviderConfig) {
  switch (config.type) {
    case 'openai':
    case 'custom':
      return getOpenAIClient(config);
    case 'anthropic':
      return getAnthropicClient(config);
    case 'google':
      return getGoogleClient(config);
    default:
      throw new Error(`Unsupported provider type: ${config.type}`);
  }
}

/**
 * Estimate cost based on tokens (rough estimates)
 */
export function estimateCost(
  provider: AiProviderType,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Rough cost estimates per 1K tokens (in USD)
  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'gemini-pro': { input: 0.0005, output: 0.0015 },
  };

  const modelCost = costs[model.toLowerCase()] || costs['gpt-3.5-turbo'];
  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;

  return inputCost + outputCost;
}

