<script lang="ts">
  import Panel from './Panel.svelte'
  import Tooltip from './Tooltip.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getVerdictColor, getQualityColor, getSentimentColor } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import type { SignalResearch } from '$lib/types'

  let researchEntries = $derived(Object.entries(dashboard.status?.signalResearch || {}))
</script>

<Panel title="SIGNAL RESEARCH" titleRight={researchEntries.length.toString()} class="h-80">
  <div class="overflow-y-auto h-full space-y-2">
    {#if researchEntries.length === 0}
      <div class="text-hud-text-dim text-sm py-4 text-center">Researching candidates...</div>
    {:else}
      {#each researchEntries as [symbol, research] (symbol)}
        {@const r = research as SignalResearch}
        <Tooltip position="left">
          {#snippet children()}
            <div
              class="p-2 border border-hud-line/30 rounded hover:border-hud-line/60 cursor-help transition-colors"
              transition:fade={{ duration: 200 }}
            >
              <div class="flex justify-between items-center mb-1">
                <span class="hud-value-sm">{symbol}</span>
                <div class="flex items-center gap-2">
                  <span class="hud-label {getQualityColor(r.entry_quality)}">{r.entry_quality.toUpperCase()}</span>
                  <span class="hud-value-sm font-bold {getVerdictColor(r.verdict)}">{r.verdict}</span>
                </div>
              </div>
              <p class="text-xs text-hud-text-dim leading-tight mb-1">{r.reasoning}</p>
              {#if r.red_flags.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each r.red_flags.slice(0, 2) as flag}
                    <span class="text-xs text-hud-error bg-hud-error/10 px-1 rounded">{flag.slice(0, 30)}...</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/snippet}
          {#snippet content()}
            <div class="space-y-2 min-w-[200px]">
              <div class="hud-label text-hud-primary border-b border-hud-line/50 pb-1">{symbol} DETAILS</div>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-hud-text-dim">Confidence</span>
                  <span class="text-hud-text-bright">{(r.confidence * 100).toFixed(0)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-hud-text-dim">Sentiment</span>
                  <span class={getSentimentColor(r.sentiment)}>{(r.sentiment * 100).toFixed(0)}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-hud-text-dim">Analyzed</span>
                  <span class="text-hud-text">{new Date(r.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
                </div>
              </div>
              {#if r.catalysts.length > 0}
                <div class="pt-1 border-t border-hud-line/30">
                  <span class="text-[9px] text-hud-text-dim">CATALYSTS:</span>
                  <ul class="mt-1 space-y-0.5">
                    {#each r.catalysts as c}
                      <li class="text-[10px] text-hud-success">+ {c}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
              {#if r.red_flags.length > 0}
                <div class="pt-1 border-t border-hud-line/30">
                  <span class="text-[9px] text-hud-text-dim">RED FLAGS:</span>
                  <ul class="mt-1 space-y-0.5">
                    {#each r.red_flags as f}
                      <li class="text-[10px] text-hud-error">- {f}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/snippet}
        </Tooltip>
      {/each}
    {/if}
  </div>
</Panel>
