// Interactive setup wizard

import { select, input, confirm, password } from '@inquirer/prompts';
import { listTemplates, getTemplate } from '../templates/providers.js';
import * as config from '../lib/config.js';
import { Profile } from '../types.js';
import { fetchModels } from './models.js';

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: { prompt: string; completion: string };
  context_length: number;
}

function formatContext(contextLength: number): string {
  if (contextLength >= 1000000) return `${(contextLength / 1000000).toFixed(1)}M`;
  if (contextLength >= 1000) return `${(contextLength / 1000).toFixed(0)}K`;
  return `${contextLength}`;
}

async function selectModelInteractive(defaultModel?: string): Promise<string | undefined> {
  // Prefetch models in background
  const modelsPromise = fetchModels();
  
  while (true) {
    const searchOrDefault = await select({
      message: 'How would you like to select a model?',
      choices: [
        { name: `Use default (${defaultModel || 'none'})`, value: 'default' },
        { name: 'Search models from OpenRouter', value: 'search' },
        { name: 'Enter model ID manually', value: 'manual' },
      ]
    });

    if (searchOrDefault === 'default') {
      return defaultModel;
    }

    if (searchOrDefault === 'manual') {
      const model = await input({
        message: 'Model ID:',
        default: defaultModel
      });
      return model || defaultModel;
    }

    // Search mode
    console.log('\nFetching models from OpenRouter...');
    const models = await modelsPromise;

    if (models.length === 0) {
      console.log('Failed to fetch models. Falling back to manual entry.');
      const model = await input({
        message: 'Model ID:',
        default: defaultModel
      });
      return model || defaultModel;
    }

    // Search loop - allows going back to search again
    while (true) {
      const searchTerm = await input({
        message: 'Search models (e.g. "glm", "minimax", "claude"):',
      });

      let filtered = models as OpenRouterModel[];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = (models as OpenRouterModel[]).filter(m =>
          m.id.toLowerCase().includes(term) ||
          m.name.toLowerCase().includes(term)
        );
      }

      if (filtered.length === 0) {
        console.log(`No models found matching "${searchTerm}". Try another search.\n`);
        continue;
      }

      // Sort and limit
      filtered.sort((a, b) => a.id.localeCompare(b.id));
      const limited = filtered.slice(0, 30);

      if (filtered.length > 30) {
        console.log(`\nShowing first 30 of ${filtered.length} matches.\n`);
      }

      const choices = [
        { name: '<< Back to search', value: '__back__' },
        { name: '<< Back to model selection', value: '__back_menu__' },
        ...limited.map(m => {
          const promptPrice = parseFloat(m.pricing.prompt) * 1000000;
          const ctx = formatContext(m.context_length);
          return {
            name: `${m.id.padEnd(40)} ${ctx.padEnd(8)} $${promptPrice.toFixed(2)}/1M`,
            value: m.id
          };
        })
      ];

      const selected = await select({
        message: 'Select a model:',
        choices,
        pageSize: 17
      });

      if (selected === '__back__') {
        continue; // Go back to search
      }
      
      if (selected === '__back_menu__') {
        break; // Go back to main menu
      }

      return selected;
    }
  }
}

export async function runSetupWizard(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Claude Env - Profile Setup Wizard    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  
  // Get profile name
  const profileName = await input({
    message: 'Profile name:',
    validate: (value) => {
      if (!value.trim()) return 'Name is required';
      if (config.profileExists(value)) return 'Profile already exists';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Only alphanumeric, dash, and underscore allowed';
      return true;
    }
  });
  
  // Select provider template
  const templates = listTemplates();
  const templateChoice = await select({
    message: 'Select a provider:',
    choices: templates.map(t => ({
      name: `${t.displayName} - ${t.description}`,
      value: t.name
    }))
  });
  
  const template = getTemplate(templateChoice)!;
  
  // Get base URL (use template default or ask for custom)
  let baseUrl = template.baseUrl;
  if (templateChoice === 'custom' || !baseUrl) {
    baseUrl = await input({
      message: 'API Base URL:',
      validate: (value) => value.trim() ? true : 'URL is required'
    });
  } else {
    const customUrl = await confirm({
      message: `Use default URL (${template.baseUrl})?`,
      default: true
    });
    
    if (!customUrl) {
      baseUrl = await input({
        message: 'Custom API Base URL:',
        default: template.baseUrl
      });
    }
  }
  
  // Get model - with search option for OpenRouter
  let model: string | undefined;
  const isOpenRouter = templateChoice.startsWith('openrouter') || template.baseUrl.includes('openrouter');
  
  if (isOpenRouter) {
    model = await selectModelInteractive(template.defaultModel);
  } else if (template.defaultModel) {
    const useDefaultModel = await confirm({
      message: `Use default model (${template.defaultModel})?`,
      default: true
    });
    
    if (!useDefaultModel) {
      model = await input({
        message: 'Model name:',
        default: template.defaultModel
      });
    } else {
      model = template.defaultModel;
    }
  } else {
    model = await input({
      message: 'Model name (optional):',
    });
  }
  
  // Get API key if required
  let apiKey: string | undefined;
  if (template.requiresApiKey) {
    if (template.setupInstructions) {
      console.log('');
      console.log(`ℹ ${template.setupInstructions}`);
      console.log('');
    }
    
    apiKey = await password({
      message: 'API Key:',
      mask: '*'
    });
  } else {
    const wantApiKey = await confirm({
      message: 'Add an API key? (optional)',
      default: false
    });
    
    if (wantApiKey) {
      apiKey = await password({
        message: 'API Key:',
        mask: '*'
      });
    }
  }
  
  // Description
  const description = await input({
    message: 'Description (optional):',
    default: template.description
  });
  
  // Clear ANTHROPIC_API_KEY?
  const clearKey = await confirm({
    message: 'Unset ANTHROPIC_API_KEY when using this profile?',
    default: template.clearAnthropicKey
  });
  
  // Create the profile
  const profile: Profile = {
    name: profileName,
    description,
    provider: template.name,
    baseUrl,
    model: model || undefined,
    apiKey: apiKey || undefined,
    clearAnthropicKey: clearKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  config.saveProfile(profile);
  
  console.log('');
  console.log('✓ Profile created successfully!');
  console.log('');
  console.log('To activate this profile, run:');
  console.log('');
  console.log(`  eval "$(ccx use ${profileName})"`);
  console.log('');
}

export async function runQuickSetup(templateName: string): Promise<void> {
  const template = getTemplate(templateName);
  
  if (!template) {
    console.error(`Template "${templateName}" not found.`);
    console.log('Available templates:');
    listTemplates().forEach(t => console.log(`  - ${t.name}`));
    process.exit(1);
  }
  
  console.log('');
  console.log(`Quick Setup: ${template.displayName}`);
  console.log('─'.repeat(40));
  
  if (template.setupInstructions) {
    console.log(`ℹ ${template.setupInstructions}`);
    console.log('');
  }
  
  const profileName = await input({
    message: 'Profile name:',
    default: templateName,
    validate: (value) => {
      if (!value.trim()) return 'Name is required';
      if (config.profileExists(value)) return 'Profile already exists';
      return true;
    }
  });

  // Model selection for OpenRouter templates
  let model = template.defaultModel;
  const isOpenRouter = templateName.startsWith('openrouter') || template.baseUrl.includes('openrouter');
  
  if (isOpenRouter) {
    model = await selectModelInteractive(template.defaultModel);
  }

  let apiKey: string | undefined;
  if (template.requiresApiKey) {
    apiKey = await password({
      message: 'API Key:',
      mask: '*',
      validate: (value) => value.trim() ? true : 'API key is required for this provider'
    });
  }
  
  const profile: Profile = {
    name: profileName,
    description: template.description,
    provider: template.name,
    baseUrl: template.baseUrl,
    model: model,
    apiKey,
    clearAnthropicKey: template.clearAnthropicKey,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  config.saveProfile(profile);
  
  console.log('');
  console.log('✓ Profile created!');
  console.log('');
  console.log(`Activate with: eval "$(ccx use ${profileName})"`);
}
