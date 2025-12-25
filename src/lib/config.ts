// Configuration manager using conf for persistent storage

import Conf from 'conf';
import * as crypto from 'crypto';
import * as os from 'os';
import { Profile, ProfileConfig } from '../types.js';

// Simple encryption for API keys (not military-grade, but better than plaintext)
const ENCRYPTION_KEY = crypto.createHash('sha256')
  .update(os.hostname() + os.userInfo().username + 'ccx-salt-v1')
  .digest();

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text; // Return as-is if decryption fails (might be unencrypted)
  }
}

const config = new Conf<ProfileConfig>({
  projectName: 'claude-env',
  defaults: {
    profiles: {},
    activeProfile: null,
    settings: {
      encryptionEnabled: true,
      defaultShell: process.platform === 'win32' ? 'powershell' : 'bash'
    }
  }
});

export function getConfig(): ProfileConfig {
  return config.store;
}

export function getProfiles(): Record<string, Profile> {
  return config.get('profiles');
}

export function getProfile(name: string): Profile | undefined {
  const profiles = getProfiles();
  const profile = profiles[name];
  if (profile && profile.apiKey) {
    // Decrypt API key when retrieving
    return { ...profile, apiKey: decrypt(profile.apiKey) };
  }
  return profile;
}

export function saveProfile(profile: Profile): void {
  const profiles = getProfiles();
  const toSave = { ...profile };
  
  // Encrypt API key before saving
  if (toSave.apiKey && config.get('settings.encryptionEnabled')) {
    toSave.apiKey = encrypt(toSave.apiKey);
  }
  
  toSave.updatedAt = new Date().toISOString();
  profiles[profile.name] = toSave;
  config.set('profiles', profiles);
}

export function deleteProfile(name: string): boolean {
  const profiles = getProfiles();
  if (profiles[name]) {
    delete profiles[name];
    config.set('profiles', profiles);
    
    // Clear active profile if it was deleted
    if (config.get('activeProfile') === name) {
      config.set('activeProfile', null);
    }
    return true;
  }
  return false;
}

export function getActiveProfile(): string | null {
  return config.get('activeProfile');
}

export function setActiveProfile(name: string | null): void {
  config.set('activeProfile', name);
}

export function profileExists(name: string): boolean {
  return name in getProfiles();
}

export function getConfigPath(): string {
  return config.path;
}

export function resetConfig(): void {
  config.clear();
}
