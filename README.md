# Claude Env (ccx)

**Environment Orchestrator and Context Switcher for Claude Code CLI**

Switch AI backends with a single command. Like `nvm` for Node.js, but for your Claude Code AI provider.

## Why?

Every time you want to switch Claude Code from the official Anthropic API to OpenRouter, DeepSeek, or a local Ollama instance, you have to manually set environment variables. This tool eliminates that friction by letting you:

- Save provider configurations as **profiles**
- Switch between them with a single command
- Keep your API keys encrypted and secure
- Support multiple shells (bash, zsh, fish, PowerShell, cmd)

**Zero server required** - Unlike proxy-based solutions, ccx just manages environment variables.

## Installation

```bash
npm install -g claude-env
```

## Quick Start

### 1. Create a profile

```bash
# Using a template
ccx create work --template openrouter --api-key sk-or-xxxxx

# Or use the interactive wizard
ccx setup
```

### 2. Activate the profile

```bash
# Bash/Zsh
eval "$(ccx use work)"

# PowerShell
Invoke-Expression (ccx use work --shell powershell)

# Fish
ccx use work --shell fish | source
```

### 3. Run Claude Code

```bash
claude
```

That's it! Claude Code will now route through OpenRouter.

### 4. Switch back to official Anthropic

```bash
eval "$(ccx use official)"
# or
eval "$(ccx reset)"
```

## Commands

| Command | Description |
|---------|-------------|
| `ccx list` | List all profiles |
| `ccx show <name>` | Show profile details |
| `ccx create <name>` | Create a new profile |
| `ccx edit <name>` | Edit an existing profile |
| `ccx delete <name>` | Delete a profile |
| `ccx use <name>` | Activate a profile (outputs shell script) |
| `ccx reset` | Reset environment to default |
| `ccx current` | Show current profile status |
| `ccx templates` | List available provider templates |
| `ccx setup` | Interactive profile setup wizard |
| `ccx export <name>` | Export profile as JSON |
| `ccx import <json>` | Import profile from JSON |

## Available Templates

| Template | Description | Default Model |
|----------|-------------|---------------|
| `official` | Anthropic Official API | claude-sonnet-4-20250514 |
| `openrouter` | OpenRouter multi-model | anthropic/claude-sonnet-4 |
| `openrouter-minimax` | MiniMax via OpenRouter | minimax/minimax-m1-80k |
| `openrouter-deepseek` | DeepSeek via OpenRouter | deepseek/deepseek-chat-v3-0324 |
| `deepseek` | DeepSeek Direct API | deepseek-chat |
| `gemini` | Google Gemini | gemini-2.5-flash |
| `ollama` | Local Ollama | qwen2.5-coder:latest |
| `lmstudio` | Local LM Studio | local-model |
| `groq` | Groq fast inference | llama-3.3-70b-versatile |
| `together` | Together AI | Meta-Llama-3.1-70B |
| `custom` | Custom endpoint | (your choice) |

## Examples

### Create profiles for different use cases

```bash
# High-stakes work with official Claude
ccx create pro --template official

# Budget-friendly coding with DeepSeek
ccx create budget --template openrouter-deepseek --api-key sk-or-xxxxx

# Local offline mode
ccx create local --template ollama

# Custom provider
ccx create myproxy --base-url http://localhost:8080/v1 --api-key my-key --model gpt-4
```

### Shell integration (add to .bashrc/.zshrc)

```bash
# Function to switch profiles easily
ccx-switch() {
  eval "$(ccx use $1)"
  echo "Switched to profile: $1"
}

# Aliases
alias cc-pro='ccx-switch pro'
alias cc-budget='ccx-switch budget'
alias cc-local='ccx-switch local'
alias cc-reset='eval "$(ccx reset)"'
```

### PowerShell integration (add to $PROFILE)

```powershell
function Switch-Claude {
  param([string]$Profile)
  Invoke-Expression (ccx use $Profile --shell powershell)
  Write-Host "Switched to profile: $Profile"
}

Set-Alias cc-switch Switch-Claude
```

## How It Works

1. **Profiles are stored** in `~/.config/claude-env/config.json` (cross-platform via `conf`)
2. **API keys are encrypted** using AES-256 with a machine-specific key
3. **`ccx use`** outputs shell-specific export commands for `eval`
4. **Environment variables set:**
   - `ANTHROPIC_BASE_URL` - The API endpoint
   - `ANTHROPIC_AUTH_TOKEN` - Your API key
   - `ANTHROPIC_MODEL` - The model to use
   - `ANTHROPIC_API_KEY` - Unset when using proxies (important!)
   - `CCX_ACTIVE_PROFILE` - Tracks the active profile

## Security

- API keys are encrypted at rest using AES-256-CBC
- Encryption key is derived from machine-specific info (hostname + username)
- Keys are never logged or exposed in plain text
- Export command excludes API keys by default

## Comparison with claude-code-router

| Feature | ccx | claude-code-router |
|---------|-----|-------------------|
| Architecture | Env vars only | Local proxy server |
| Background process | No | Yes |
| Profile switching | Instant | Requires restart |
| Request routing | N/A | Yes (background/think/etc) |
| Custom transformers | N/A | Yes |
| Complexity | Low | High |

**Use ccx if:** You want simple, fast profile switching without running a server.

**Use claude-code-router if:** You need advanced request routing or custom transformers.

## Troubleshooting

### "Profile not taking effect"

Make sure you're using `eval`:
```bash
# Wrong
ccx use work

# Right
eval "$(ccx use work)"
```

### "Shell not detected correctly"

Specify the shell explicitly:
```bash
ccx use work --shell zsh
```

### "Config file location"

```bash
ccx config-path
```

## License

MIT
