// Interactive setup wizard

import { select, input, confirm, password } from '@inquirer/prompts';
import { listTemplates, getTemplate } from '../templates/providers.js';
import * as config from '../lib/config.js';
import { Profile } from '../types.js';

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
  
  // Get model
  let model = template.defaultModel;
  if (template.defaultModel) {
    const useDefaultModel = await confirm({
      message: `Use default model (${template.defaultModel})?`,
      default: true
    });
    
    if (!useDefaultModel) {
      model = await input({
        message: 'Model name:',
        default: template.defaultModel
      });
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
    model: template.defaultModel,
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
