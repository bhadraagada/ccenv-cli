// Pre-built provider templates for quick setup

import { ProviderTemplate } from '../types.js';

export const providerTemplates: ProviderTemplate[] = [
  {
    name: 'openrouter',
    displayName: 'OpenRouter (GLM-4.7)',
    description: 'OpenRouter with ZhipuAI GLM-4.7 model',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'z-ai/glm-4.7',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://openrouter.ai/keys'
  },
  {
    name: 'openrouter-minimax',
    displayName: 'OpenRouter (MiniMax M2.1)',
    description: 'OpenRouter with MiniMax M2.1 model',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'minimax/minimax-m2.1',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://openrouter.ai/keys'
  }
];

export function getTemplate(name: string): ProviderTemplate | undefined {
  return providerTemplates.find(t => t.name === name);
}

export function listTemplates(): ProviderTemplate[] {
  return providerTemplates;
}
