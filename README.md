# Guard Action - AI Prompt Security

[![npm downloads](https://img.shields.io/npm/dw/@ny-squared/guard)](https://www.npmjs.com/package/@ny-squared/guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Detect prompt injection and PII in LLM prompts directly in your CI/CD pipeline.**

Add one step to your GitHub Actions workflow to automatically scan AI prompts for security risks before they reach production.

Powered by [`@ny-squared/guard`](https://www.npmjs.com/package/@ny-squared/guard) -- zero external API calls, fully offline, sub-millisecond performance.

---

## Quick Start

```yaml
- name: Scan AI prompt
  uses: ny-squared/guard-action@v1
  with:
    prompt: ${{ env.LLM_PROMPT }}
```

That's it. If a prompt injection or PII is detected above the default threshold (0.7), the workflow fails automatically.

---

## What It Detects

| Threat Type | Examples |
|-------------|----------|
| **Prompt Injection** | "Ignore all previous instructions", "[SYSTEM] override", jailbreak patterns |
| **PII Leakage** | Email addresses, phone numbers, SSNs, credit card numbers |

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `prompt` | Yes | - | The LLM prompt text to scan |
| `threshold` | No | `0.7` | Risk score threshold (0.0-1.0). Fails if exceeded |
| `fail_on_block` | No | `true` | Fail the workflow if prompt is blocked |
| `api_key` | No | - | PromptGuard API key (optional, for advanced cloud features) |

## Outputs

| Output | Description |
|--------|-------------|
| `risk_score` | Risk score from 0.0 to 1.0 |
| `blocked` | Whether the prompt was blocked (`true`/`false`) |
| `risk_type` | Type of risk detected (`injection`/`pii`/`none`) |
| `details` | JSON string with full scan details |

---

## Usage Examples

### Basic: Block dangerous prompts

```yaml
name: AI Security Check
on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Scan prompt for injection
        uses: ny-squared/guard-action@v1
        with:
          prompt: "Translate this text to French: Hello world"
          threshold: '0.7'
```

### Custom threshold with PII check

```yaml
- name: Check for PII in prompt
  uses: ny-squared/guard-action@v1
  with:
    prompt: ${{ steps.build-prompt.outputs.text }}
    threshold: '0.5'
    fail_on_block: 'true'
```

### Get score without failing (custom logic)

```yaml
- name: Get risk score
  id: guard
  uses: ny-squared/guard-action@v1
  with:
    prompt: ${{ env.PROMPT }}
    fail_on_block: 'false'

- name: Custom risk handling
  if: steps.guard.outputs.blocked == 'true'
  run: |
    echo "Risk Score: ${{ steps.guard.outputs.risk_score }}"
    echo "Risk Type: ${{ steps.guard.outputs.risk_type }}"
    echo "Details: ${{ steps.guard.outputs.details }}"
    # Add custom alerting, logging, or notification logic here
```

### PR review: Scan prompt templates on change

```yaml
name: Prompt Security Review
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'src/prompts/**'

jobs:
  scan-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Read prompt template
        id: read-prompt
        run: |
          PROMPT=$(cat prompts/system-prompt.txt)
          echo "text=$PROMPT" >> $GITHUB_OUTPUT

      - name: Scan prompt template
        uses: ny-squared/guard-action@v1
        with:
          prompt: ${{ steps.read-prompt.outputs.text }}
          threshold: '0.6'
```

---

## How It Works

1. Your workflow passes a prompt string to the action
2. `@ny-squared/guard` scans it locally (no external API calls) for injection patterns and PII
3. The action outputs the risk score, threat type, and block status
4. If the risk score exceeds your threshold and `fail_on_block` is `true`, the workflow fails

All scanning happens inside the GitHub Actions runner. No data leaves your CI environment.

---

## Advanced: PromptGuard Cloud

For advanced features (cloud-based scanning, audit logs, team dashboard), provide your PromptGuard API key:

```yaml
- name: Scan with PromptGuard Cloud
  uses: ny-squared/guard-action@v1
  with:
    prompt: ${{ env.PROMPT }}
    api_key: ${{ secrets.PROMPTGUARD_API_KEY }}
```

Get your API key at [app.trypromptguard.com](https://app.trypromptguard.com).

---

## Related

- [`@ny-squared/guard`](https://www.npmjs.com/package/@ny-squared/guard) - The underlying SDK
- [PromptGuard Dashboard](https://app.trypromptguard.com) - Web-based threat monitoring
- [AI Security Benchmark](https://aibench.trypromptguard.com) - Test your LLM security

---

## License

MIT
