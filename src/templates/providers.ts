// Pre-built provider templates for quick setup

import { ProviderTemplate } from '../types.js';

export const providerTemplates: ProviderTemplate[] = [
  {
    name: 'official',
    displayName: 'Anthropic Official',
    description: 'Official Anthropic API - Uses your ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    requiresApiKey: false,  // Uses existing ANTHROPIC_API_KEY
    clearAnthropicKey: false,
    setupInstructions: 'Uses your existing ANTHROPIC_API_KEY environment variable.'
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    description: 'Access multiple AI models through OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'anthropic/claude-sonnet-4',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://openrouter.ai/keys'
  },
  {
    name: 'openrouter-minimax',
    displayName: 'OpenRouter (MiniMax M2.1)',
    description: 'Budget-friendly MiniMax M2.1 via OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'minimax/minimax-m1-80k',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://openrouter.ai/keys'
  },
  {
    name: 'openrouter-deepseek',
    displayName: 'OpenRouter (DeepSeek)',
    description: 'DeepSeek models via OpenRouter',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'deepseek/deepseek-chat-v3-0324',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://openrouter.ai/keys'
  },
  {
    name: 'deepseek',
    displayName: 'DeepSeek Direct',
    description: 'Direct DeepSeek API access',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://platform.deepseek.com/'
  },
  {
    name: 'gemini',
    displayName: 'Google Gemini',
    description: 'Google Gemini models via AI Studio',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://aistudio.google.com/apikey'
  },
  {
    name: 'ollama',
    displayName: 'Ollama (Local)',
    description: 'Local Ollama instance for offline AI',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5-coder:latest',
    requiresApiKey: false,
    clearAnthropicKey: true,
    setupInstructions: 'Make sure Ollama is running: ollama serve'
  },
  {
    name: 'lmstudio',
    displayName: 'LM Studio (Local)',
    description: 'Local LM Studio instance',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    requiresApiKey: false,
    clearAnthropicKey: true,
    setupInstructions: 'Start LM Studio and load a model with local server enabled'
  },
  {
    name: 'groq',
    displayName: 'Groq',
    description: 'Ultra-fast inference with Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://console.groq.com/keys'
  },
  {
    name: 'together',
    displayName: 'Together AI',
    description: 'Together AI inference platform',
    baseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Get your API key at https://api.together.xyz/'
  },
  {
    name: 'custom',
    displayName: 'Custom Provider',
    description: 'Configure your own custom API endpoint',
    baseUrl: '',
    requiresApiKey: true,
    clearAnthropicKey: true,
    setupInstructions: 'Enter your custom API base URL and credentials'
  }
];

export function getTemplate(name: string): ProviderTemplate | undefined {
  return providerTemplates.find(t => t.name === name);
}

export function listTemplates(): ProviderTemplate[] {
  return providerTemplates;
}
