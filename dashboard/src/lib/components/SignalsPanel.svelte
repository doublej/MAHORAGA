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
    <div class="flex items-center justify-between px-2 pb-2 text-[9px] uppercase tracking-[0.3em] text-hud-text-dim border-b border-hud-line/20">
      <span>Symbol / Source</span>
      <span>Volume / Sentiment</span>
    </div>
    {#if dashboard.signals.length === 0}
      <div class="text-hud-text-dim text-sm py-4 text-center">Gathering signals...</div>
    {:else}
      {#each dashboard.signals.slice(0, 20) as sig, i (`${sig.symbol}-${sig.source}-${i}`)}
        {@const chips = ([
          sig.bullish !== undefined ? { label: 'Bull', value: sig.bullish, color: 'text-hud-success' } : null,
          sig.bearish !== undefined ? { label: 'Bear', value: sig.bearish, color: 'text-hud-error' } : null,
          sig.score !== undefined ? { label: 'Score', value: sig.score } : null,
          sig.upvotes !== undefined ? { label: 'Up', value: sig.upvotes } : null,
          sig.price !== undefined ? { label: 'Px', value: formatCurrency(sig.price) } : null,
          sig.momentum !== undefined ? { label: 'Mom', value: `${sig.momentum >= 0 ? '+' : ''}${sig.momentum.toFixed(2)}%`, color: sig.momentum >= 0 ? 'text-hud-success' : 'text-hud-error' } : null,
        ].filter(Boolean) as Array<{ label: string; value: string | number; color?: string }>)}
        <Tooltip position="right">
          {#snippet children()}
            <div
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2 px-2 cursor-help hud-row {sig.isCrypto ? 'bg-hud-warning/5' : ''}"
              transition:fly={{ x: -10, duration: 200, delay: i * 20 }}
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  {#if sig.isCrypto}<span class="text-hud-warning text-xs">₿</span>{/if}
                  <span class="hud-value-sm">{sig.symbol}</span>
                  <span class="hud-label {sig.isCrypto ? 'text-hud-warning' : ''}">
                    {sig.source?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                {#if sig.reason || chips.length > 0}
                  <div class="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-start">
                    <div class="min-w-0">
                      {#if sig.reason}
                        <p class="text-xs text-hud-text-dim line-clamp-2 break-words">{sig.reason}</p>
                      {/if}
                    </div>
                    {#if chips.length > 0}
                      <div class="flex flex-nowrap items-center gap-1 whitespace-nowrap">
                        {#each chips.slice(0, 3) as chip}
                          <span class="hud-chip {chip.color || ''}">
                            <span class="text-hud-text-dim">{chip.label}</span>
                            <span class="hud-nums">{chip.value}</span>
                          </span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                {#if sig.isCrypto && sig.momentum !== undefined}
                  <span class="hud-label {sig.momentum >= 0 ? 'text-hud-success' : 'text-hud-error'}">
                    MOM {sig.momentum >= 0 ? '+' : ''}{sig.momentum.toFixed(1)}%
                  </span>
                {:else}
                  <span class="hud-label">VOL {sig.volume}</span>
                {/if}
                <span class="hud-value-sm hud-nums {getSentimentColor(sig.sentiment)}">
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
