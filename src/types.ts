// Type definitions for Claude Env

export interface Profile {
  name: string;
  description?: string;
  provider: string;
  baseUrl: string;
  model?: string;
  apiKey?: string;  // Stored encrypted in config, decrypted at runtime
  clearAnthropicKey: boolean;  // Whether to unset ANTHROPIC_API_KEY
  extraEnv?: Record<string, string>;  // Additional env vars
  createdAt: string;
  updatedAt: string;
}

export interface ProfileConfig {
  profiles: Record<string, Profile>;
  activeProfile: string | null;
  settings: {
    encryptionEnabled: boolean;
    defaultShell: 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';
  };
}

export interface ProviderTemplate {
  name: string;
  displayName: string;
  description: string;
  baseUrl: string;
  defaultModel?: string;
  requiresApiKey: boolean;
  clearAnthropicKey: boolean;
  setupInstructions?: string;
}

export interface EnvVars {
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  [key: string]: string | undefined;
}

export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';
