<script lang="ts">
  import Panel from './Panel.svelte'
  import DetailWindow from './DetailWindow.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { formatCurrency, getSentimentColor } from '$lib/utils'
  import { fly } from 'svelte/transition'
  import type { Signal } from '$lib/types'

  let activeSignal = $state<Signal | null>(null)
  let detailsMinimized = $state(false)

  function openDetails(sig: Signal) {
    activeSignal = sig
    detailsMinimized = false
  }

  function closeDetails() {
    activeSignal = null
    detailsMinimized = false
  }

  function minimizeDetails() {
    if (!activeSignal) return
    detailsMinimized = true
  }

  function restoreDetails() {
    detailsMinimized = false
  }
</script>

<Panel title="ACTIVE SIGNALS" titleRight={dashboard.signals.length.toString()} class="h-[18.5rem] sm:h-80">
  <div class="overflow-y-auto h-full space-y-1 pr-1">
    <div class="flex items-center justify-between px-2 pb-2 text-[9px] uppercase tracking-[0.3em] text-hud-text-dim border-b border-hud-line/20">
      <span>Symbol / Source</span>
      <span>Vol / Sent</span>
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

        <button
          type="button"
          class="w-full text-left py-2 px-2 rounded cursor-pointer hud-row {sig.isCrypto ? 'bg-hud-warning/5' : ''}"
          onclick={() => openDetails(sig)}
          transition:fly={{ x: -8, duration: 180, delay: i * 18 }}
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                {#if sig.isCrypto}<span class="text-hud-warning text-xs">₿</span>{/if}
                <span class="hud-value-sm">{sig.symbol}</span>
                <span class="hud-label {sig.isCrypto ? 'text-hud-warning' : ''}">{sig.source?.toUpperCase() || 'N/A'}</span>
                <span class="hud-label text-hud-primary">DETAILS</span>
              </div>

              {#if sig.reason}
                <p class="mt-1 text-xs text-hud-text-dim line-clamp-2 break-words">{sig.reason}</p>
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

          {#if chips.length > 0}
            <div class="mt-1.5 flex flex-wrap gap-1">
              {#each chips.slice(0, 4) as chip}
                <span class="hud-chip {chip.color || ''}">
                  <span class="text-hud-text-dim">{chip.label}</span>
                  <span class="hud-nums">{chip.value}</span>
                </span>
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    {/if}
  </div>
</Panel>

{#if activeSignal}
  <DetailWindow
    open={true}
    minimized={detailsMinimized}
    minimizedIndex={2}
    title={`${activeSignal.symbol} / ${activeSignal.source?.toUpperCase() || 'N/A'}`}
    subtitle={activeSignal.isCrypto ? 'CRYPTO SIGNAL' : 'EQUITY SIGNAL'}
    onClose={closeDetails}
    onMinimize={minimizeDetails}
    onRestore={restoreDetails}
  >
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <div class="hud-label">Sentiment</div>
          <div class="hud-value-sm {getSentimentColor(activeSignal.sentiment)}">
            {(activeSignal.sentiment * 100).toFixed(0)}%
          </div>
        </div>
        <div class="space-y-1">
          <div class="hud-label">Volume</div>
          <div class="hud-value-sm hud-nums">{activeSignal.volume}</div>
        </div>
        {#if activeSignal.price !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Price</div>
            <div class="hud-value-sm hud-nums">{formatCurrency(activeSignal.price)}</div>
          </div>
        {/if}
        {#if activeSignal.momentum !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Momentum</div>
            <div class="hud-value-sm {activeSignal.momentum >= 0 ? 'text-hud-success' : 'text-hud-error'}">
              {activeSignal.momentum >= 0 ? '+' : ''}{activeSignal.momentum.toFixed(2)}%
            </div>
          </div>
        {/if}
        {#if activeSignal.bullish !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Bullish Mentions</div>
            <div class="hud-value-sm text-hud-success hud-nums">{activeSignal.bullish}</div>
          </div>
        {/if}
        {#if activeSignal.bearish !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Bearish Mentions</div>
            <div class="hud-value-sm text-hud-error hud-nums">{activeSignal.bearish}</div>
          </div>
        {/if}
        {#if activeSignal.score !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Score</div>
            <div class="hud-value-sm hud-nums">{activeSignal.score}</div>
          </div>
        {/if}
        {#if activeSignal.upvotes !== undefined}
          <div class="space-y-1">
            <div class="hud-label">Upvotes</div>
            <div class="hud-value-sm hud-nums">{activeSignal.upvotes}</div>
          </div>
        {/if}
      </div>

      {#if activeSignal.reason}
        <div class="pt-3 border-t border-hud-line/40">
          <div class="hud-label mb-1">Reasoning</div>
          <p class="text-xs text-hud-text leading-relaxed break-words">{activeSignal.reason}</p>
        </div>
      {/if}
    </div>
  </DetailWindow>
{/if}
