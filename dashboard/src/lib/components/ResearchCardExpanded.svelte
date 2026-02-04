<script lang="ts">
  import { getSentimentColor } from '$lib/utils'
  import type { SignalResearch } from '$lib/types'

  interface Props {
    symbol: string
    research: SignalResearch
  }

  let { symbol, research }: Props = $props()
</script>

<div class="px-2 pb-2 space-y-3">
  <!-- Full Reasoning -->
  <div class="research-section">
    <div class="hud-label text-hud-text-dim mb-1">REASONING</div>
    <p class="text-xs text-hud-text leading-relaxed">{research.reasoning}</p>
  </div>

  <!-- Metadata Grid -->
  <div class="research-section grid grid-cols-2 gap-2">
    <div>
      <span class="hud-label text-hud-text-dim block mb-0.5">Confidence</span>
      <span class="hud-value-sm text-hud-text-bright">{(research.confidence * 100).toFixed(0)}%</span>
    </div>
    <div>
      <span class="hud-label text-hud-text-dim block mb-0.5">Sentiment</span>
      <span class="hud-value-sm {getSentimentColor(research.sentiment)}">{(research.sentiment * 100).toFixed(0)}%</span>
    </div>
    <div>
      <span class="hud-label text-hud-text-dim block mb-0.5">Entry Quality</span>
      <span class="hud-value-sm text-hud-text">{research.entry_quality.toUpperCase()}</span>
    </div>
    <div>
      <span class="hud-label text-hud-text-dim block mb-0.5">Analyzed</span>
      <span class="hud-value-sm text-hud-text">{new Date(research.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
    </div>
  </div>

  <!-- Catalysts -->
  {#if research.catalysts.length > 0}
    <div class="research-section">
      <div class="hud-label text-hud-text-dim mb-2">CATALYSTS</div>
      <ul class="space-y-1.5">
        {#each research.catalysts as catalyst}
          <li class="flex items-start gap-2">
            <span class="text-hud-success shrink-0 mt-0.5">+</span>
            <span class="text-xs text-hud-success leading-relaxed">{catalyst}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Red Flags -->
  {#if research.red_flags.length > 0}
    <div class="research-section">
      <div class="hud-label text-hud-text-dim mb-2">RED FLAGS</div>
      <ul class="space-y-1.5">
        {#each research.red_flags as flag}
          <li class="flex items-start gap-2">
            <span class="text-hud-error shrink-0 mt-0.5">−</span>
            <span class="text-xs text-hud-error leading-relaxed">{flag}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
