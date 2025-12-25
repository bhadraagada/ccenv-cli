// Profile management commands

import * as config from '../lib/config.js';
import { generateShellScript, generateResetScript, detectShell } from '../lib/shell.js';
import { getTemplate, listTemplates } from '../templates/providers.js';
import { Profile, ShellType } from '../types.js';

export function listProfiles(): void {
  const profiles = config.getProfiles();
  const activeProfile = config.getActiveProfile();
  const profileNames = Object.keys(profiles);
  
  if (profileNames.length === 0) {
    console.log('No profiles configured yet.');
    console.log('');
    console.log('Create one with:');
    console.log('  ccx create <name>');
    console.log('');
    console.log('Or use a template:');
    console.log('  ccx create myprofile --template openrouter');
    return;
  }
  
  console.log('Profiles:\n');
  
  for (const name of profileNames.sort()) {
    const profile = profiles[name];
    const isActive = name === activeProfile;
    const marker = isActive ? ' * ' : '   ';
    const activeLabel = isActive ? ' (active)' : '';
    
    console.log(`${marker}${name}${activeLabel}`);
    console.log(`      Provider: ${profile.provider}`);
    console.log(`      Base URL: ${profile.baseUrl}`);
    if (profile.model) {
      console.log(`      Model: ${profile.model}`);
    }
    console.log('');
  }
}

export function showProfile(name: string): void {
  const profile = config.getProfile(name);
  
  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }
  
  console.log(`Profile: ${profile.name}`);
  console.log('─'.repeat(40));
  console.log(`Provider:     ${profile.provider}`);
  console.log(`Base URL:     ${profile.baseUrl}`);
  console.log(`Model:        ${profile.model || '(default)'}`);
  console.log(`API Key:      ${profile.apiKey ? '********' : '(not set)'}`);
  console.log(`Clear Key:    ${profile.clearAnthropicKey ? 'Yes' : 'No'}`);
  if (profile.description) {
    console.log(`Description:  ${profile.description}`);
  }
  console.log(`Created:      ${profile.createdAt}`);
  console.log(`Updated:      ${profile.updatedAt}`);
}

export function createProfile(
  name: string, 
  options: {
    template?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    description?: string;
    clearKey?: boolean;
  }
): void {
  if (config.profileExists(name)) {
    console.error(`Profile "${name}" already exists. Use 'ccx edit ${name}' to modify it.`);
    process.exit(1);
  }
  
  let profile: Profile;
  
  if (options.template) {
    const template = getTemplate(options.template);
    if (!template) {
      console.error(`Template "${options.template}" not found.`);
      console.log('Available templates:');
      listTemplates().forEach(t => console.log(`  - ${t.name}: ${t.description}`));
      process.exit(1);
    }
    
    profile = {
      name,
      description: options.description || template.description,
      provider: template.name,
      baseUrl: options.baseUrl || template.baseUrl,
      model: options.model || template.defaultModel,
      apiKey: options.apiKey,
      clearAnthropicKey: options.clearKey ?? template.clearAnthropicKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (template.requiresApiKey && !options.apiKey) {
      console.log(`Note: This template requires an API key.`);
      if (template.setupInstructions) {
        console.log(`Setup: ${template.setupInstructions}`);
      }
      console.log(`Add it with: ccx edit ${name} --api-key YOUR_KEY`);
    }
  } else {
    if (!options.baseUrl) {
      console.error('Either --template or --base-url is required.');
      process.exit(1);
    }
    
    profile = {
      name,
      description: options.description,
      provider: 'custom',
      baseUrl: options.baseUrl,
      model: options.model,
      apiKey: options.apiKey,
      clearAnthropicKey: options.clearKey ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  config.saveProfile(profile);
  console.log(`Profile "${name}" created successfully.`);
  console.log('');
  console.log(`Activate it with:`);
  console.log(`  eval "$(ccx use ${name})"`);
}

export function editProfile(
  name: string,
  options: {
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    description?: string;
    clearKey?: boolean;
  }
): void {
  const profile = config.getProfile(name);
  
  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }
  
  if (options.baseUrl !== undefined) profile.baseUrl = options.baseUrl;
  if (options.model !== undefined) profile.model = options.model;
  if (options.apiKey !== undefined) profile.apiKey = options.apiKey;
  if (options.description !== undefined) profile.description = options.description;
  if (options.clearKey !== undefined) profile.clearAnthropicKey = options.clearKey;
  
  config.saveProfile(profile);
  console.log(`Profile "${name}" updated successfully.`);
}

export function deleteProfileCommand(name: string, force: boolean = false): void {
  if (!config.profileExists(name)) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }
  
  if (!force) {
    console.log(`To confirm deletion, run: ccx delete ${name} --force`);
    return;
  }
  
  config.deleteProfile(name);
  console.log(`Profile "${name}" deleted.`);
}

export function useProfile(name: string, shell?: ShellType): void {
  const profile = config.getProfile(name);
  
  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }
  
  const detectedShell = shell || detectShell();
  const script = generateShellScript(profile, detectedShell);
  
  // Output the script for eval
  console.log(script);
  
  // Update active profile in config
  config.setActiveProfile(name);
}

export function resetEnvironment(shell?: ShellType): void {
  const detectedShell = shell || detectShell();
  const script = generateResetScript(detectedShell);
  
  console.log(script);
  config.setActiveProfile(null);
}

export function showCurrent(): void {
  const activeProfile = config.getActiveProfile();
  const envProfile = process.env.CCX_ACTIVE_PROFILE;
  
  console.log('Current Status:');
  console.log('─'.repeat(40));
  console.log(`Config active:  ${activeProfile || '(none)'}`);
  console.log(`Shell active:   ${envProfile || '(none)'}`);
  console.log('');
  console.log('Environment Variables:');
  console.log(`  ANTHROPIC_BASE_URL:   ${process.env.ANTHROPIC_BASE_URL || '(not set)'}`);
  console.log(`  ANTHROPIC_AUTH_TOKEN: ${process.env.ANTHROPIC_AUTH_TOKEN ? '********' : '(not set)'}`);
  console.log(`  ANTHROPIC_MODEL:      ${process.env.ANTHROPIC_MODEL || '(not set)'}`);
  console.log(`  ANTHROPIC_API_KEY:    ${process.env.ANTHROPIC_API_KEY ? '********' : '(not set)'}`);
}

export function showTemplates(): void {
  console.log('Available Provider Templates:\n');
  
  for (const template of listTemplates()) {
    console.log(`  ${template.name}`);
    console.log(`    ${template.displayName}`);
    console.log(`    ${template.description}`);
    if (template.defaultModel) {
      console.log(`    Default model: ${template.defaultModel}`);
    }
    console.log('');
  }
  
  console.log('Usage: ccx create <name> --template <template-name>');
}

export function exportProfile(name: string): void {
  const profile = config.getProfile(name);
  
  if (!profile) {
    console.error(`Profile "${name}" not found.`);
    process.exit(1);
  }
  
  // Export without the API key for safety
  const exported = { ...profile, apiKey: undefined };
  console.log(JSON.stringify(exported, null, 2));
}

export function importProfile(jsonStr: string, name?: string): void {
  try {
    const imported = JSON.parse(jsonStr) as Profile;
    
    if (name) {
      imported.name = name;
    }
    
    if (!imported.name) {
      console.error('Profile name is required. Use --name flag or include "name" in JSON.');
      process.exit(1);
    }
    
    if (config.profileExists(imported.name)) {
      console.error(`Profile "${imported.name}" already exists.`);
      process.exit(1);
    }
    
    imported.createdAt = new Date().toISOString();
    imported.updatedAt = new Date().toISOString();
    
    config.saveProfile(imported);
    console.log(`Profile "${imported.name}" imported successfully.`);
    
    if (!imported.apiKey) {
      console.log(`Note: No API key was imported. Add one with: ccx edit ${imported.name} --api-key YOUR_KEY`);
    }
  } catch (e) {
    console.error('Invalid JSON:', e);
    process.exit(1);
  }
}
