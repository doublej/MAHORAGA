<script lang="ts">
  import Panel from './Panel.svelte'
  import { submitSetupKeys } from '$lib/api'

  let { onComplete }: { onComplete: () => void } = $props()

  let step = $state(0)
  let disclaimerAccepted = $state(false)
  let saving = $state(false)
  let error = $state<string | null>(null)

  let alpacaKey = $state('')
  let alpacaSecret = $state('')
  let openaiKey = $state('')
  let paperMode = $state(true)
  let startingEquity = $state(100000)

  async function handleSubmit() {
    if (!alpacaKey || !alpacaSecret) {
      error = 'Alpaca API Key and Secret are required'
      return
    }

    saving = true
    error = null

    const result = await submitSetupKeys({
      alpaca_key: alpacaKey,
      alpaca_secret: alpacaSecret,
      openai_key: openaiKey || undefined,
      paper_mode: paperMode,
      starting_equity: startingEquity,
    })

    saving = false
    if (result.error) error = result.error
    else step = 3
  }
</script>

<div class="min-h-screen bg-hud-bg flex items-center justify-center p-6">
  <Panel title="MAHORAGA SETUP" class="w-full max-w-xl">
    {#if step === 0}
      <div class="space-y-6">
        <div class="text-center py-2">
          <h2 class="text-xl font-light text-hud-warning mb-2">Risk Disclaimer</h2>
          <p class="text-hud-text-dim text-xs">Please read carefully before proceeding</p>
        </div>

        <div class="bg-hud-bg p-4 rounded text-xs text-hud-text-dim space-y-3 max-h-64 overflow-y-auto">
          <p>This software is provided for <strong class="text-hud-text">educational and informational purposes only</strong>. Nothing in this software constitutes financial, investment, legal, or tax advice.</p>
          <p><strong class="text-hud-text">By using this software, you acknowledge and agree that:</strong></p>
          <ul class="list-disc pl-4 space-y-1">
            <li>All trading and investment decisions are made <strong class="text-hud-warning">at your own risk</strong></li>
            <li>Markets are volatile and <strong class="text-hud-error">you can lose some or all of your capital</strong></li>
            <li>No guarantees of performance, profits, or outcomes are made</li>
            <li>The authors, contributors, and maintainers are not responsible for any financial losses</li>
            <li>You are solely responsible for your own trades and investment decisions</li>
            <li>This software may contain bugs, errors, or behave unexpectedly</li>
            <li>Past performance does not guarantee future results</li>
          </ul>
          <p><strong class="text-hud-error">If you do not fully understand the risks involved in trading or investing, you should not use this software.</strong></p>
          <p>No member, contributor, or operator of this project shall be held liable for losses of any kind.</p>
        </div>

        <div class="flex items-start gap-2">
          <input type="checkbox" id="acceptDisclaimer" bind:checked={disclaimerAccepted} class="accent-hud-primary mt-1" />
          <label for="acceptDisclaimer" class="text-xs text-hud-text">
            I have read and understand the risks. I accept full responsibility for any losses that may occur from using this software.
          </label>
        </div>

        <div class="pt-4 border-t border-hud-line">
          <button class="hud-button w-full disabled:opacity-50 disabled:cursor-not-allowed" onclick={() => (step = 1)} disabled={!disclaimerAccepted}>
            I Understand, Continue
          </button>
        </div>
      </div>
    {:else if step === 1}
      <div class="space-y-6">
        <div class="text-center py-4">
          <h2 class="text-2xl font-light text-hud-text-bright mb-2">Welcome to Mahoraga</h2>
          <p class="text-hud-text-dim text-sm">Autonomous trading powered by social sentiment and AI analysis</p>
        </div>

        <div class="space-y-4 text-sm text-hud-text">
          <div class="flex items-start gap-3"><span class="text-hud-success">1.</span><span>Monitors StockTwits for sentiment signals</span></div>
          <div class="flex items-start gap-3"><span class="text-hud-success">2.</span><span>AI research agents analyze candidates 24/7</span></div>
          <div class="flex items-start gap-3"><span class="text-hud-success">3.</span><span>LLM makes final trading decisions at market open</span></div>
          <div class="flex items-start gap-3"><span class="text-hud-success">4.</span><span>Automatic stop-loss and take-profit protection</span></div>
        </div>

        <div class="pt-4 border-t border-hud-line">
          <button class="hud-button w-full" onclick={() => (step = 2)}>Get Started</button>
        </div>
      </div>
    {:else if step === 2}
      <div class="space-y-6">
        <div>
          <h3 class="hud-label mb-4 text-hud-primary">Alpaca Trading Account</h3>
          <p class="text-xs text-hud-text-dim mb-4">
            Get your API keys from
            <a href="https://app.alpaca.markets" target="_blank" rel="noopener noreferrer" class="text-hud-primary hover:underline">app.alpaca.markets</a>
          </p>
          <div class="space-y-3">
            <div>
              <label class="hud-label block mb-1">API Key</label>
              <input type="text" class="hud-input w-full" placeholder="PK..." bind:value={alpacaKey} />
            </div>
            <div>
              <label class="hud-label block mb-1">API Secret</label>
              <input type="password" class="hud-input w-full" placeholder="Secret key..." bind:value={alpacaSecret} />
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="paperMode" bind:checked={paperMode} class="accent-hud-primary" />
              <label for="paperMode" class="hud-label">Paper Trading Mode (recommended for testing)</label>
            </div>
          </div>
        </div>

        <div>
          <h3 class="hud-label mb-4 text-hud-primary">OpenAI API Key (Optional)</h3>
          <p class="text-xs text-hud-text-dim mb-4">
            Required for AI-powered analysis. Get from
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" class="text-hud-primary hover:underline">platform.openai.com</a>
          </p>
          <input type="password" class="hud-input w-full" placeholder="sk-..." bind:value={openaiKey} />
        </div>

        <div>
          <h3 class="hud-label mb-4 text-hud-primary">Starting Equity</h3>
          <p class="text-xs text-hud-text-dim mb-4">Your account starting balance (for P&L tracking)</p>
          <input type="number" class="hud-input w-full" bind:value={startingEquity} />
        </div>

        {#if error}
          <div class="text-hud-error text-sm p-2 border border-hud-error/30 rounded">{error}</div>
        {/if}

        <div class="flex gap-4 pt-4 border-t border-hud-line">
          <button class="hud-button flex-1" onclick={() => (step = 1)}>Back</button>
          <button class="hud-button flex-1" onclick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    {:else if step === 3}
      <div class="space-y-6 text-center py-8">
        <div class="text-hud-success text-4xl mb-4">&#10003;</div>
        <h2 class="text-xl font-light text-hud-text-bright">Configuration Saved</h2>
        <p class="text-hud-text-dim text-sm">Please restart the agent to apply the new settings:</p>
        <code class="block bg-hud-bg p-3 text-hud-primary text-sm rounded">
          curl localhost:8787/agent/disable && curl localhost:8787/agent/enable
        </code>
        <button class="hud-button mt-4" onclick={onComplete}>Continue to Dashboard</button>
      </div>
    {/if}
  </Panel>
</div>
