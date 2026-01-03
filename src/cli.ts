#!/usr/bin/env node

// Claude Env (ccx) - Environment Orchestrator for Claude Code CLI

import { Command } from 'commander';
import {
  listProfiles,
  showProfile,
  createProfile,
  editProfile,
  deleteProfileCommand,
  useProfile,
  resetEnvironment,
  showCurrent,
  showTemplates,
  exportProfile,
  importProfile
} from './commands/profile.js';
import { runSetupWizard, runQuickSetup } from './commands/wizard.js';
import { listModels, getModelInfo, searchModelsInteractive } from './commands/models.js';
import { getConfigPath } from './lib/config.js';
import { ShellType } from './types.js';

const program = new Command();

program
  .name('ccx')
  .description('Environment Orchestrator and Context Switcher for Claude Code CLI')
  .version('1.0.0');

// List all profiles
program
  .command('list')
  .alias('ls')
  .description('List all profiles')
  .action(listProfiles);

// Show a specific profile
program
  .command('show <name>')
  .description('Show profile details')
  .action(showProfile);

// Create a new profile
program
  .command('create <name>')
  .description('Create a new profile')
  .option('-t, --template <template>', 'Use a provider template')
  .option('-u, --base-url <url>', 'API base URL')
  .option('-m, --model <model>', 'Default model')
  .option('-k, --api-key <key>', 'API key')
  .option('-d, --description <desc>', 'Profile description')
  .option('--clear-key', 'Unset ANTHROPIC_API_KEY when using this profile', true)
  .option('--no-clear-key', 'Keep ANTHROPIC_API_KEY when using this profile')
  .action((name, options) => {
    createProfile(name, {
      template: options.template,
      baseUrl: options.baseUrl,
      model: options.model,
      apiKey: options.apiKey,
      description: options.description,
      clearKey: options.clearKey
    });
  });

// Edit an existing profile
program
  .command('edit <name>')
  .description('Edit an existing profile')
  .option('-u, --base-url <url>', 'API base URL')
  .option('-m, --model <model>', 'Default model')
  .option('-k, --api-key <key>', 'API key')
  .option('-d, --description <desc>', 'Profile description')
  .option('--clear-key', 'Unset ANTHROPIC_API_KEY when using this profile')
  .option('--no-clear-key', 'Keep ANTHROPIC_API_KEY when using this profile')
  .action((name, options) => {
    editProfile(name, {
      baseUrl: options.baseUrl,
      model: options.model,
      apiKey: options.apiKey,
      description: options.description,
      clearKey: options.clearKey
    });
  });

// Delete a profile
program
  .command('delete <name>')
  .alias('rm')
  .description('Delete a profile')
  .option('-f, --force', 'Force deletion without confirmation')
  .action((name, options) => {
    deleteProfileCommand(name, options.force);
  });

// Use/activate a profile (outputs shell script for eval)
program
  .command('use <name>')
  .description('Activate a profile (use with eval)')
  .option('-s, --shell <shell>', 'Shell type: bash, zsh, fish, powershell, cmd')
  .action((name, options) => {
    useProfile(name, options.shell as ShellType);
  });

// Reset to default (unset all ccx env vars)
program
  .command('reset')
  .description('Reset environment to default (use with eval)')
  .option('-s, --shell <shell>', 'Shell type: bash, zsh, fish, powershell, cmd')
  .action((options) => {
    resetEnvironment(options.shell as ShellType);
  });

// Show current status
program
  .command('current')
  .alias('status')
  .description('Show current profile and environment status')
  .action(showCurrent);

// Show available templates
program
  .command('templates')
  .description('List available provider templates')
  .action(showTemplates);

// Models command - list, search, info
program
  .command('models [search]')
  .description('List and search available models from OpenRouter')
  .option('-l, --limit <number>', 'Max models to show', '30')
  .option('-i, --info <model>', 'Show detailed info for a specific model')
  .option('--interactive', 'Interactive model selection')
  .action(async (search, options) => {
    if (options.info) {
      await getModelInfo(options.info);
    } else if (options.interactive) {
      const model = await searchModelsInteractive();
      if (model) {
        console.log(`\nSelected: ${model}`);
        console.log(`\nUse with: ccx create <profile> --template openrouter --model ${model}`);
      }
    } else {
      await listModels(search, parseInt(options.limit));
    }
  });

// Interactive setup wizard
program
  .command('setup')
  .description('Interactive profile setup wizard')
  .option('-t, --template <template>', 'Quick setup with a specific template')
  .action(async (options) => {
    if (options.template) {
      await runQuickSetup(options.template);
    } else {
      await runSetupWizard();
    }
  });

// Export a profile (without API key)
program
  .command('export <name>')
  .description('Export profile as JSON (without API key)')
  .action(exportProfile);

// Import a profile
program
  .command('import <json>')
  .description('Import profile from JSON')
  .option('-n, --name <name>', 'Override profile name')
  .action((json, options) => {
    importProfile(json, options.name);
  });

// Show config file path
program
  .command('config-path')
  .description('Show configuration file path')
  .action(() => {
    console.log(getConfigPath());
  });

// Quick alias commands for common operations
program
  .command('official')
  .description('Quick switch to official Anthropic (creates profile if needed)')
  .action(async () => {
    const { profileExists } = await import('./lib/config.js');
    if (!profileExists('official')) {
      createProfile('official', { template: 'official' });
    }
    useProfile('official');
  });

program
  .command('openrouter')
  .description('Quick setup/switch to OpenRouter')
  .action(async () => {
    const { profileExists } = await import('./lib/config.js');
    if (!profileExists('openrouter')) {
      await runQuickSetup('openrouter');
    } else {
      useProfile('openrouter');
    }
  });

// Run Claude with a specific profile
program
  .command('run [name]')
  .description('Activate profile and launch Claude Code directly')
  .option('-p, --profile <name>', 'Profile to use')
  .action(async (name, options) => {
    const profileName = name || options.profile;
    const { runWithProfile, runReset } = await import('./commands/profile.js');
    
    if (profileName) {
      await runWithProfile(profileName);
    } else {
      await runReset();
    }
  });

// Parse and execute
program.parse();
