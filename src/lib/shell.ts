// Shell script generators for different shells

import { Profile, ShellType, EnvVars } from '../types.js';

export function generateEnvVars(profile: Profile): EnvVars {
  const env: EnvVars = {};
  
  // Set the base URL
  if (profile.baseUrl) {
    env.ANTHROPIC_BASE_URL = profile.baseUrl;
  }
  
  // Set the auth token (API key)
  if (profile.apiKey) {
    env.ANTHROPIC_AUTH_TOKEN = profile.apiKey;
  }
  
  // Set the model if specified
  if (profile.model) {
    env.ANTHROPIC_MODEL = profile.model;
  }
  
  // Handle ANTHROPIC_API_KEY clearing
  if (profile.clearAnthropicKey) {
    env.ANTHROPIC_API_KEY = ''; // Empty string signals to unset
  }
  
  // Add any extra environment variables
  if (profile.extraEnv) {
    Object.assign(env, profile.extraEnv);
  }
  
  return env;
}

export function generateShellScript(profile: Profile, shell: ShellType): string {
  const env = generateEnvVars(profile);
  
  switch (shell) {
    case 'bash':
    case 'zsh':
      return generateBashScript(env, profile);
    case 'fish':
      return generateFishScript(env, profile);
    case 'powershell':
      return generatePowerShellScript(env, profile);
    case 'cmd':
      return generateCmdScript(env, profile);
    default:
      return generateBashScript(env, profile);
  }
}

function generateBashScript(env: EnvVars, profile: Profile): string {
  const lines: string[] = [
    `# Claude Env - Profile: ${profile.name}`,
    `# Generated: ${new Date().toISOString()}`,
    ''
  ];
  
  for (const [key, value] of Object.entries(env)) {
    if (value === '') {
      lines.push(`unset ${key}`);
    } else if (value !== undefined) {
      // Escape special characters
      const escaped = value.replace(/'/g, "'\\''");
      lines.push(`export ${key}='${escaped}'`);
    }
  }
  
  lines.push('');
  lines.push(`# Active profile: ${profile.name}`);
  lines.push(`export CCX_ACTIVE_PROFILE='${profile.name}'`);
  
  return lines.join('\n');
}

function generateFishScript(env: EnvVars, profile: Profile): string {
  const lines: string[] = [
    `# Claude Env - Profile: ${profile.name}`,
    `# Generated: ${new Date().toISOString()}`,
    ''
  ];
  
  for (const [key, value] of Object.entries(env)) {
    if (value === '') {
      lines.push(`set -e ${key}`);
    } else if (value !== undefined) {
      const escaped = value.replace(/'/g, "\\'");
      lines.push(`set -gx ${key} '${escaped}'`);
    }
  }
  
  lines.push('');
  lines.push(`set -gx CCX_ACTIVE_PROFILE '${profile.name}'`);
  
  return lines.join('\n');
}

function generatePowerShellScript(env: EnvVars, profile: Profile): string {
  const lines: string[] = [
    `# Claude Env - Profile: ${profile.name}`,
    `# Generated: ${new Date().toISOString()}`,
    ''
  ];
  
  for (const [key, value] of Object.entries(env)) {
    if (value === '') {
      lines.push(`Remove-Item Env:\\${key} -ErrorAction SilentlyContinue`);
    } else if (value !== undefined) {
      // Escape for PowerShell
      const escaped = value.replace(/'/g, "''");
      lines.push(`$env:${key} = '${escaped}'`);
    }
  }
  
  lines.push('');
  lines.push(`$env:CCX_ACTIVE_PROFILE = '${profile.name}'`);
  
  return lines.join('\n');
}

function generateCmdScript(env: EnvVars, profile: Profile): string {
  const lines: string[] = [
    `@REM Claude Env - Profile: ${profile.name}`,
    `@REM Generated: ${new Date().toISOString()}`,
    ''
  ];
  
  for (const [key, value] of Object.entries(env)) {
    if (value === '') {
      lines.push(`set ${key}=`);
    } else if (value !== undefined) {
      lines.push(`set ${key}=${value}`);
    }
  }
  
  lines.push('');
  lines.push(`set CCX_ACTIVE_PROFILE=${profile.name}`);
  
  return lines.join('\n');
}

export function generateResetScript(shell: ShellType): string {
  const varsToUnset = [
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_MODEL',
    'CCX_ACTIVE_PROFILE'
  ];
  
  switch (shell) {
    case 'bash':
    case 'zsh':
      return varsToUnset.map(v => `unset ${v}`).join('\n');
    case 'fish':
      return varsToUnset.map(v => `set -e ${v}`).join('\n');
    case 'powershell':
      return varsToUnset.map(v => `Remove-Item Env:\\${v} -ErrorAction SilentlyContinue`).join('\n');
    case 'cmd':
      return varsToUnset.map(v => `set ${v}=`).join('\n');
    default:
      return varsToUnset.map(v => `unset ${v}`).join('\n');
  }
}

export function detectShell(): ShellType {
  const shell = process.env.SHELL || process.env.ComSpec || '';
  
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('bash')) return 'bash';
  if (shell.includes('powershell') || shell.includes('pwsh')) return 'powershell';
  if (process.platform === 'win32') return 'powershell';
  
  return 'bash';
}
