<script lang="ts">
  import MetricInline from './MetricInline.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'

  let config = $derived(dashboard.config)
</script>

<footer class="mt-4 pt-3 border-t border-hud-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
  <div class="flex flex-wrap gap-4 md:gap-6">
    {#if config}
      <MetricInline label="MAX POS" value="${config.max_position_value}" />
      <MetricInline label="MIN SENT" value="{(config.min_sentiment_score * 100).toFixed(0)}%" />
      <MetricInline label="TAKE PROFIT" value="{config.take_profit_pct}%" />
      <MetricInline label="STOP LOSS" value="{config.stop_loss_pct}%" />
      <span class="hidden lg:inline text-hud-line">|</span>
      <MetricInline
        label="OPTIONS"
        value={config.options_enabled ? 'ON' : 'OFF'}
        valueClassName={config.options_enabled ? 'text-hud-purple' : 'text-hud-text-dim'}
      />
      {#if config.options_enabled}
        <MetricInline label="OPT Δ" value={config.options_target_delta?.toFixed(2) || '0.35'} />
        <MetricInline label="OPT DTE" value="{config.options_min_dte || 7}-{config.options_max_dte || 45}" />
      {/if}
      <span class="hidden lg:inline text-hud-line">|</span>
      <MetricInline
        label="CRYPTO"
        value={config.crypto_enabled ? '24/7' : 'OFF'}
        valueClassName={config.crypto_enabled ? 'text-hud-warning' : 'text-hud-text-dim'}
      />
      {#if config.crypto_enabled}
        <MetricInline label="SYMBOLS" value={(config.crypto_symbols || ['BTC', 'ETH', 'SOL']).map(s => s.split('/')[0]).join('/')} />
      {/if}
    {/if}
  </div>
  <div class="flex items-center gap-4">
    <span class="hud-label hidden md:inline">AUTONOMOUS TRADING SYSTEM</span>
    <span class="hud-value-sm">PAPER MODE</span>
  </div>
</footer>
