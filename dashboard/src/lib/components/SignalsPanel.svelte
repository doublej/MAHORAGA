<script lang="ts">
  import Panel from './Panel.svelte'
  import Tooltip from './Tooltip.svelte'
  import TooltipContent from './TooltipContent.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { formatCurrency, getSentimentColor } from '$lib/utils'
  import { fly } from 'svelte/transition'
</script>

<Panel title="ACTIVE SIGNALS" titleRight={dashboard.signals.length.toString()} class="h-80">
  <div class="overflow-y-auto h-full space-y-1">
    {#if dashboard.signals.length === 0}
      <div class="text-hud-text-dim text-sm py-4 text-center">Gathering signals...</div>
    {:else}
      {#each dashboard.signals.slice(0, 20) as sig, i (`${sig.symbol}-${sig.source}-${i}`)}
        <Tooltip position="right">
          {#snippet children()}
            <div
              class="flex items-center justify-between py-1 px-2 border-b border-hud-line/10 hover:bg-hud-line/10 cursor-help {sig.isCrypto ? 'bg-hud-warning/5' : ''}"
              transition:fly={{ x: -10, duration: 200, delay: i * 20 }}
            >
              <div class="flex items-center gap-2">
                {#if sig.isCrypto}<span class="text-hud-warning text-xs">₿</span>{/if}
                <span class="hud-value-sm">{sig.symbol}</span>
                <span class="hud-label {sig.isCrypto ? 'text-hud-warning' : ''}">{sig.source?.toUpperCase() || 'N/A'}</span>
              </div>
              <div class="flex items-center gap-3">
                {#if sig.isCrypto && sig.momentum !== undefined}
                  <span class="hud-label hidden sm:inline {sig.momentum >= 0 ? 'text-hud-success' : 'text-hud-error'}">
                    {sig.momentum >= 0 ? '+' : ''}{sig.momentum.toFixed(1)}%
                  </span>
                {:else}
                  <span class="hud-label hidden sm:inline">VOL {sig.volume}</span>
                {/if}
                <span class="hud-value-sm {getSentimentColor(sig.sentiment)}">
                  {(sig.sentiment * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          {/snippet}
          {#snippet content()}
            <TooltipContent
              title="{sig.symbol} - {sig.source?.toUpperCase() || 'N/A'}"
              items={[
                { label: 'Sentiment', value: `${(sig.sentiment * 100).toFixed(0)}%`, color: getSentimentColor(sig.sentiment) },
                { label: 'Volume', value: sig.volume },
                ...(sig.bullish !== undefined ? [{ label: 'Bullish', value: sig.bullish, color: 'text-hud-success' }] : []),
                ...(sig.bearish !== undefined ? [{ label: 'Bearish', value: sig.bearish, color: 'text-hud-error' }] : []),
                ...(sig.score !== undefined ? [{ label: 'Score', value: sig.score }] : []),
                ...(sig.upvotes !== undefined ? [{ label: 'Upvotes', value: sig.upvotes }] : []),
                ...(sig.momentum !== undefined ? [{ label: 'Momentum', value: `${sig.momentum >= 0 ? '+' : ''}${sig.momentum.toFixed(2)}%` }] : []),
                ...(sig.price !== undefined ? [{ label: 'Price', value: formatCurrency(sig.price) }] : []),
              ]}
              description={sig.reason}
            />
          {/snippet}
        </Tooltip>
      {/each}
    {/if}
  </div>
</Panel>
