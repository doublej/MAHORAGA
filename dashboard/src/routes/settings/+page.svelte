<script lang="ts">
  import { onMount } from 'svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import Panel from '$lib/components/Panel.svelte'
  import StatusIndicator from '$lib/components/StatusIndicator.svelte'
  import type { Config } from '$lib/types'

  const SECTIONS = [
    { id: 'connection', label: 'Connection' },
    { id: 'trading', label: 'Trading' },
    { id: 'risk', label: 'Risk' },
    { id: 'llm', label: 'LLM' },
    { id: 'options', label: 'Options' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'stale', label: 'Stale Positions' },
  ] as const

  let activeSection = $state('connection')
  let saving = $state(false)
  let saveMessage = $state<string | null>(null)

  // Local connection state (localStorage-only)
  let backendUrl = $state(localStorage.getItem('mahoraga_backend_url') || '')
  let apiToken = $state(localStorage.getItem('mahoraga_api_token') || '')

  // Local copy of server config
  let localConfig = $state<Config | null>(null)

  onMount(() => {
    if (!dashboard.status) {
      dashboard.poll().then(() => {
        if (dashboard.config) localConfig = $state.snapshot(dashboard.config) as Config
      })
    } else if (dashboard.config) {
      localConfig = $state.snapshot(dashboard.config) as Config
    }
  })

  // Sync when config loads later
  $effect(() => {
    if (dashboard.config && !localConfig) {
      localConfig = $state.snapshot(dashboard.config) as Config
    }
  })

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    if (!localConfig) return
    localConfig = { ...localConfig, [key]: value }
  }

  function handleConnectionSave() {
    if (backendUrl) localStorage.setItem('mahoraga_backend_url', backendUrl)
    else localStorage.removeItem('mahoraga_backend_url')

    if (apiToken) localStorage.setItem('mahoraga_api_token', apiToken)
    else localStorage.removeItem('mahoraga_api_token')

    // Re-poll with new connection settings instead of reloading
    dashboard.poll()
    flashMessage('Connection settings saved')
  }

  async function handleSave() {
    if (!localConfig) return
    saving = true
    try {
      await dashboard.handleSaveConfig(localConfig)
      flashMessage('Configuration saved')
    } finally {
      saving = false
    }
  }

  function flashMessage(msg: string) {
    saveMessage = msg
    setTimeout(() => (saveMessage = null), 2000)
  }

  function scrollToSection(id: string) {
    activeSection = id
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<div class="min-h-screen bg-hud-bg flex">
  <!-- Sidebar -->
  <nav class="w-48 shrink-0 border-r border-hud-line p-4 sticky top-0 h-screen">
    <a href="/" class="hud-label hover:text-hud-primary transition-colors block mb-6">&larr; DASHBOARD</a>
    <h2 class="text-sm font-light text-hud-text-bright mb-4">SETTINGS</h2>
    <ul class="space-y-1">
      {#each SECTIONS as section}
        <li>
          <button
            class="w-full text-left px-2 py-1.5 text-[11px] transition-colors {activeSection === section.id
              ? 'text-hud-text-bright bg-hud-line/30'
              : 'text-hud-text-dim hover:text-hud-text'}"
            onclick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <!-- Main content -->
  <main class="flex-1 max-w-4xl p-6 pb-20 space-y-6">
    <!-- Connection -->
    <section id="section-connection">
      <Panel title="CONNECTION">
        <div class="space-y-4">
          <div>
            <label class="hud-label block mb-1">Backend URL</label>
            <input
              type="text"
              class="hud-input w-full"
              bind:value={backendUrl}
              placeholder="Leave empty for relative /api (default)"
            />
            <p class="text-[9px] text-hud-text-dim mt-1">
              E.g. https://mahoraga.jurrejan.workers.dev/agent — leave empty for local dev.
            </p>
          </div>
          <div>
            <label class="hud-label block mb-1">API Token (Optional)</label>
            <input
              type="password"
              class="hud-input w-full"
              bind:value={apiToken}
              placeholder="Enter MAHORAGA_API_TOKEN"
            />
            <p class="text-[9px] text-hud-text-dim mt-1">
              Use this for bearer auth, or leave empty and authenticate through Cloudflare Access.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <button class="hud-button" onclick={handleConnectionSave}>Save Connection</button>
            <StatusIndicator
              status={dashboard.error ? 'error' : dashboard.status ? 'active' : 'inactive'}
              label={dashboard.error ? 'DISCONNECTED' : dashboard.status ? 'CONNECTED' : 'UNKNOWN'}
            />
          </div>
        </div>
      </Panel>
    </section>

    {#if localConfig}
      <!-- Trading / Position Limits -->
      <section id="section-trading">
        <Panel title="POSITION LIMITS">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="hud-label block mb-1">Max Position Value ($)</label>
              <input type="number" class="hud-input w-full" value={localConfig.max_position_value} oninput={(e) => set('max_position_value', Number((e.target as HTMLInputElement).value))} />
            </div>
            <div>
              <label class="hud-label block mb-1">Max Positions</label>
              <input type="number" class="hud-input w-full" value={localConfig.max_positions} oninput={(e) => set('max_positions', Number((e.target as HTMLInputElement).value))} />
            </div>
            <div>
              <label class="hud-label block mb-1">Position Size (% of Cash)</label>
              <input type="number" class="hud-input w-full" value={localConfig.position_size_pct_of_cash} oninput={(e) => set('position_size_pct_of_cash', Number((e.target as HTMLInputElement).value))} />
            </div>
            <div>
              <label class="hud-label block mb-1">Starting Equity ($)</label>
              <input type="number" class="hud-input w-full" value={localConfig.starting_equity || 100000} oninput={(e) => set('starting_equity', Number((e.target as HTMLInputElement).value))} />
              <p class="text-[9px] text-hud-text-dim mt-1">For P&L calculation</p>
            </div>
          </div>
        </Panel>
      </section>

      <section id="section-risk">
        <Panel title="RISK MANAGEMENT">
          <div class="space-y-4">
            <div>
              <h3 class="hud-label mb-3 text-hud-primary">Sentiment Thresholds</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="hud-label block mb-1">Min Sentiment to Buy (0-1)</label>
                  <input type="number" step="0.05" class="hud-input w-full" value={localConfig.min_sentiment_score} oninput={(e) => set('min_sentiment_score', Number((e.target as HTMLInputElement).value))} />
                </div>
                <div>
                  <label class="hud-label block mb-1">Min Analyst Confidence (0-1)</label>
                  <input type="number" step="0.05" class="hud-input w-full" value={localConfig.min_analyst_confidence} oninput={(e) => set('min_analyst_confidence', Number((e.target as HTMLInputElement).value))} />
                </div>
                <div>
                  <label class="hud-label block mb-1">Sell Sentiment Threshold</label>
                  <input type="number" step="0.05" class="hud-input w-full" value={localConfig.sell_sentiment_threshold} oninput={(e) => set('sell_sentiment_threshold', Number((e.target as HTMLInputElement).value))} />
                </div>
              </div>
            </div>
            <div>
              <h3 class="hud-label mb-3 text-hud-primary">Stop Loss / Take Profit</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="hud-label block mb-1">Take Profit (%)</label>
                  <input type="number" class="hud-input w-full" value={localConfig.take_profit_pct} oninput={(e) => set('take_profit_pct', Number((e.target as HTMLInputElement).value))} />
                </div>
                <div>
                  <label class="hud-label block mb-1">Stop Loss (%)</label>
                  <input type="number" class="hud-input w-full" value={localConfig.stop_loss_pct} oninput={(e) => set('stop_loss_pct', Number((e.target as HTMLInputElement).value))} />
                </div>
              </div>
            </div>
            <div>
              <h3 class="hud-label mb-3 text-hud-primary">Polling Intervals</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="hud-label block mb-1">Data Poll (ms)</label>
                  <input type="number" step="1000" class="hud-input w-full" value={localConfig.data_poll_interval_ms} oninput={(e) => set('data_poll_interval_ms', Number((e.target as HTMLInputElement).value))} />
                </div>
                <div>
                  <label class="hud-label block mb-1">Analyst Interval (ms)</label>
                  <input type="number" step="1000" class="hud-input w-full" value={localConfig.analyst_interval_ms} oninput={(e) => set('analyst_interval_ms', Number((e.target as HTMLInputElement).value))} />
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <!-- LLM -->
      <section id="section-llm">
        <Panel title="LLM CONFIGURATION">
          <p class="text-[9px] text-hud-text-dim mb-3">Provider is set via LLM_PROVIDER env var (auto/openai/claude). Models must match your active provider.</p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="hud-label block mb-1">Research Model (cheap)</label>
              <select class="hud-input w-full" value={localConfig.llm_model} onchange={(e) => set('llm_model', (e.target as HTMLSelectElement).value)}>
                <optgroup label="Claude">
                  <option value="claude-haiku-4-20250414">claude-haiku-4.5</option>
                  <option value="claude-sonnet-4-5-20250414">claude-sonnet-4.5</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-5-mini">gpt-5-mini</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </optgroup>
                <optgroup label="OpenAI Reasoning">
                  <option value="o4-mini">o4-mini</option>
                  <option value="o3-mini">o3-mini</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="hud-label block mb-1">Analyst Model (smart)</label>
              <select class="hud-input w-full" value={localConfig.llm_analyst_model || 'claude-sonnet-4-5-20250414'} onchange={(e) => set('llm_analyst_model', (e.target as HTMLSelectElement).value)}>
                <optgroup label="Claude">
                  <option value="claude-opus-4-5-20251101">claude-opus-4.5 (best)</option>
                  <option value="claude-sonnet-4-5-20250414">claude-sonnet-4.5</option>
                  <option value="claude-haiku-4-20250414">claude-haiku-4.5 (cheaper)</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="gpt-5">gpt-5</option>
                  <option value="gpt-5-mini">gpt-5-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                </optgroup>
                <optgroup label="OpenAI Reasoning">
                  <option value="o4-mini">o4-mini</option>
                  <option value="o3-mini">o3-mini</option>
                </optgroup>
              </select>
            </div>
          </div>
        </Panel>
      </section>

      <!-- Options -->
      <section id="section-options">
        <Panel title="OPTIONS TRADING (BETA)">
          <div class="space-y-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="hud-input w-4 h-4" checked={localConfig.options_enabled || false} onchange={(e) => set('options_enabled', (e.target as HTMLInputElement).checked)} />
              <span class="hud-label">Enable Options Trading</span>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="hud-label block mb-1">Min Confidence (0-1)</label>
                <input type="number" step="0.05" class="hud-input w-full" value={localConfig.options_min_confidence || 0.75} oninput={(e) => set('options_min_confidence', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Max % Per Trade</label>
                <input type="number" step="0.5" class="hud-input w-full" value={localConfig.options_max_pct_per_trade || 2} oninput={(e) => set('options_max_pct_per_trade', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Min DTE (days)</label>
                <input type="number" class="hud-input w-full" value={localConfig.options_min_dte || 7} oninput={(e) => set('options_min_dte', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Max DTE (days)</label>
                <input type="number" class="hud-input w-full" value={localConfig.options_max_dte || 45} oninput={(e) => set('options_max_dte', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Target Delta</label>
                <input type="number" step="0.05" class="hud-input w-full" value={localConfig.options_target_delta || 0.35} oninput={(e) => set('options_target_delta', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Max Positions</label>
                <input type="number" class="hud-input w-full" value={localConfig.options_max_positions || 3} oninput={(e) => set('options_max_positions', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Stop Loss (%)</label>
                <input type="number" class="hud-input w-full" value={localConfig.options_stop_loss_pct || 50} oninput={(e) => set('options_stop_loss_pct', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Take Profit (%)</label>
                <input type="number" class="hud-input w-full" value={localConfig.options_take_profit_pct || 100} oninput={(e) => set('options_take_profit_pct', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.options_enabled} />
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <!-- Crypto -->
      <section id="section-crypto">
        <Panel title="CRYPTO TRADING (24/7)">
          <div class="space-y-4">
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="hud-input w-4 h-4" checked={localConfig.crypto_enabled || false} onchange={(e) => set('crypto_enabled', (e.target as HTMLInputElement).checked)} />
                <span class="hud-label">Enable Crypto Trading</span>
              </label>
              <p class="text-[9px] text-hud-text-dim mt-1">Trade crypto 24/7 based on momentum. Alpaca supports 20+ coins.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="hud-label block mb-1">Symbols (comma-separated)</label>
                <input type="text" class="hud-input w-full" value={(localConfig.crypto_symbols || ['BTC/USD', 'ETH/USD', 'SOL/USD']).join(', ')} oninput={(e) => set('crypto_symbols', (e.target as HTMLInputElement).value.split(',').map(s => s.trim()) as unknown as Config['crypto_symbols'])} disabled={!localConfig.crypto_enabled} placeholder="BTC/USD, ETH/USD, SOL/USD" />
              </div>
              <div>
                <label class="hud-label block mb-1">Momentum Threshold (%)</label>
                <input type="number" step="0.5" class="hud-input w-full" value={localConfig.crypto_momentum_threshold || 2.0} oninput={(e) => set('crypto_momentum_threshold', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.crypto_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Max Position ($)</label>
                <input type="number" class="hud-input w-full" value={localConfig.crypto_max_position_value || 1000} oninput={(e) => set('crypto_max_position_value', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.crypto_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Take Profit (%)</label>
                <input type="number" class="hud-input w-full" value={localConfig.crypto_take_profit_pct || 10} oninput={(e) => set('crypto_take_profit_pct', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.crypto_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Stop Loss (%)</label>
                <input type="number" class="hud-input w-full" value={localConfig.crypto_stop_loss_pct || 5} oninput={(e) => set('crypto_stop_loss_pct', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.crypto_enabled} />
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <!-- Stale Positions -->
      <section id="section-stale">
        <Panel title="STALE POSITION MANAGEMENT">
          <div class="space-y-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" class="hud-input w-4 h-4" checked={localConfig.stale_position_enabled ?? true} onchange={(e) => set('stale_position_enabled', (e.target as HTMLInputElement).checked)} />
              <span class="hud-label">Enable Stale Position Detection</span>
            </label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="hud-label block mb-1">Max Hold Days</label>
                <input type="number" class="hud-input w-full" value={localConfig.stale_max_hold_days || 3} oninput={(e) => set('stale_max_hold_days', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.stale_position_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Min Gain % to Keep</label>
                <input type="number" step="0.5" class="hud-input w-full" value={localConfig.stale_min_gain_pct || 5} oninput={(e) => set('stale_min_gain_pct', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.stale_position_enabled} />
              </div>
              <div>
                <label class="hud-label block mb-1">Social Volume Decay</label>
                <input type="number" step="0.1" class="hud-input w-full" value={localConfig.stale_social_volume_decay || 0.3} oninput={(e) => set('stale_social_volume_decay', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.stale_position_enabled} />
                <p class="text-[9px] text-hud-text-dim mt-1">Exit if volume drops to this % of entry</p>
              </div>
              <div>
                <label class="hud-label block mb-1">No Mentions Hours</label>
                <input type="number" class="hud-input w-full" value={localConfig.stale_no_mentions_hours || 8} oninput={(e) => set('stale_no_mentions_hours', Number((e.target as HTMLInputElement).value))} disabled={!localConfig.stale_position_enabled} />
                <p class="text-[9px] text-hud-text-dim mt-1">Exit if no mentions for N hours</p>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <!-- Sticky save bar -->
      <div class="fixed bottom-0 left-48 right-0 bg-hud-bg border-t border-hud-line p-4 flex items-center gap-4">
        <button class="hud-button" onclick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {#if saveMessage}
          <span class="text-[11px] text-hud-success">{saveMessage}</span>
        {/if}
      </div>
    {:else}
      <Panel title="LOADING">
        <p class="text-hud-text-dim text-[11px]">Waiting for config from backend...</p>
      </Panel>
    {/if}
  </main>
</div>
