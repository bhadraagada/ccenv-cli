// Models command - fetch and search available models from OpenRouter

import { select, input } from '@inquirer/prompts';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  top_provider?: {
    max_completion_tokens?: number;
  };
}

interface ModelsResponse {
  data: OpenRouterModel[];
}

let cachedModels: OpenRouterModel[] | null = null;

export async function fetchModels(): Promise<OpenRouterModel[]> {
  if (cachedModels) return cachedModels;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data = await response.json() as ModelsResponse;
    cachedModels = data.data || [];
    return cachedModels;
  } catch (error) {
    console.error('Error fetching models:', (error as Error).message);
    return [];
  }
}

export async function listModels(searchTerm?: string, limit: number = 30): Promise<void> {
  console.log('Fetching models from OpenRouter...\n');
  
  const models = await fetchModels();
  
  if (models.length === 0) {
    console.error('No models found or failed to fetch.');
    return;
  }

  let filtered = models;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = models.filter(m => 
      m.id.toLowerCase().includes(term) || 
      m.name.toLowerCase().includes(term) ||
      (m.description?.toLowerCase().includes(term))
    );
  }

  if (filtered.length === 0) {
    console.log(`No models found matching "${searchTerm}"`);
    return;
  }

  // Sort by name
  filtered.sort((a, b) => a.id.localeCompare(b.id));
  
  const showing = filtered.slice(0, limit);
  
  console.log(`Found ${filtered.length} models${searchTerm ? ` matching "${searchTerm}"` : ''}:`);
  if (filtered.length > limit) {
    console.log(`(showing first ${limit}, use --limit to show more)\n`);
  } else {
    console.log('');
  }

  // Print as table
  console.log('Model ID'.padEnd(45) + 'Context'.padEnd(12) + 'Price (per 1M tokens)');
  console.log('─'.repeat(80));
  
  for (const model of showing) {
    const promptPrice = parseFloat(model.pricing.prompt) * 1000000;
    const completionPrice = parseFloat(model.pricing.completion) * 1000000;
    const priceStr = `$${promptPrice.toFixed(2)} / $${completionPrice.toFixed(2)}`;
    const contextStr = formatContext(model.context_length);
    
    console.log(
      model.id.padEnd(45) + 
      contextStr.padEnd(12) + 
      priceStr
    );
  }
  
  console.log('');
  console.log('Usage: ccx create <profile> --template openrouter --model <model-id>');
}

export async function searchModelsInteractive(): Promise<string | null> {
  console.log('Fetching models from OpenRouter...\n');
  
  const models = await fetchModels();
  
  if (models.length === 0) {
    console.error('No models found or failed to fetch.');
    return null;
  }

  // First, ask for search term
  const searchTerm = await input({
    message: 'Search models (or press enter to browse all):',
  });

  let filtered = models;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = models.filter(m => 
      m.id.toLowerCase().includes(term) || 
      m.name.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    console.log(`No models found matching "${searchTerm}"`);
    return null;
  }

  // Sort by name and limit choices
  filtered.sort((a, b) => a.id.localeCompare(b.id));
  const choices = filtered.slice(0, 50).map(m => {
    const promptPrice = parseFloat(m.pricing.prompt) * 1000000;
    const contextStr = formatContext(m.context_length);
    return {
      name: `${m.id.padEnd(40)} ${contextStr.padEnd(10)} $${promptPrice.toFixed(2)}/1M`,
      value: m.id,
    };
  });

  if (filtered.length > 50) {
    console.log(`\nShowing first 50 of ${filtered.length} matches. Use a more specific search term.\n`);
  }

  const selected = await select({
    message: 'Select a model:',
    choices,
    pageSize: 15,
  });

  return selected;
}

function formatContext(contextLength: number): string {
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M`;
  } else if (contextLength >= 1000) {
    return `${(contextLength / 1000).toFixed(0)}K`;
  }
  return `${contextLength}`;
}

export async function getModelInfo(modelId: string): Promise<void> {
  const models = await fetchModels();
  const model = models.find(m => m.id === modelId);
  
  if (!model) {
    console.error(`Model "${modelId}" not found.`);
    return;
  }

  const promptPrice = parseFloat(model.pricing.prompt) * 1000000;
  const completionPrice = parseFloat(model.pricing.completion) * 1000000;

  console.log(`\nModel: ${model.id}`);
  console.log('─'.repeat(50));
  console.log(`Name:          ${model.name}`);
  console.log(`Context:       ${formatContext(model.context_length)} tokens`);
  console.log(`Prompt:        $${promptPrice.toFixed(4)} / 1M tokens`);
  console.log(`Completion:    $${completionPrice.toFixed(4)} / 1M tokens`);
  if (model.description) {
    console.log(`Description:   ${model.description}`);
  }
  console.log('');
}
