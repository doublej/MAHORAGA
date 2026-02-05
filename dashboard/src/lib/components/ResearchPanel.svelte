<script lang="ts">
  import Panel from './Panel.svelte'
  import DetailWindow from './DetailWindow.svelte'
  import ResearchCardExpanded from './ResearchCardExpanded.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getVerdictColor, getQualityColor } from '$lib/utils'
  import { fade } from 'svelte/transition'
  import type { SignalResearch } from '$lib/types'

  let researchEntries = $derived(Object.entries(dashboard.status?.signalResearch || {}))
  let activeSymbol = $state<string | null>(null)
  let detailsMinimized = $state(false)

  const activeResearch = $derived(
    activeSymbol ? (dashboard.status?.signalResearch?.[activeSymbol] ?? null) : null,
  )

  function openDetails(symbol: string) {
    activeSymbol = symbol
    detailsMinimized = false
  }

  function closeDetails() {
    activeSymbol = null
    detailsMinimized = false
  }

  function minimizeDetails() {
    if (!activeSymbol) return
    detailsMinimized = true
  }

  function restoreDetails() {
    detailsMinimized = false
  }

  function handleKeydown(event: KeyboardEvent, symbol: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDetails(symbol)
    }
  }
</script>

<Panel title="SIGNAL RESEARCH" titleRight={researchEntries.length.toString()} class="h-[18.5rem] sm:h-80">
  <div class="overflow-y-auto h-full space-y-2 pr-1">
    {#if researchEntries.length === 0}
      <div class="text-hud-text-dim text-sm py-4 text-center">Researching candidates...</div>
    {:else}
      {#each researchEntries as [symbol, research] (symbol)}
        {@const r = research as SignalResearch}
        {@const isActive = activeSymbol === symbol && !detailsMinimized}

        <div
          class="border rounded transition-all duration-200 p-2 cursor-pointer {isActive
            ? 'border-hud-primary bg-hud-line/5 shadow-[0_0_8px_rgba(142,180,194,0.12)]'
            : 'border-hud-line/30'}"
          role="button"
          tabindex="0"
          onkeydown={(e) => handleKeydown(e, symbol)}
          onclick={() => openDetails(symbol)}
          transition:fade={{ duration: 180 }}
        >
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2 min-w-0">
              <span class="hud-value-sm truncate">{symbol}</span>
              <span class="hud-label {getQualityColor(r.entry_quality)}">{r.entry_quality?.toUpperCase() || 'N/A'}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="hud-value-sm font-bold {getVerdictColor(r.verdict)}">{r.verdict}</span>
              <span class="hud-label text-hud-primary">{isActive ? 'OPEN' : 'DETAILS'}</span>
            </div>
          </div>

          <p class="text-xs text-hud-text-dim leading-tight line-clamp-2 break-words">{r.reasoning}</p>

          <div class="mt-2 flex flex-wrap gap-1.5">
            {#if r.catalysts.length > 0}
              <span class="hud-chip text-hud-success">
                + {r.catalysts.length} catalyst{r.catalysts.length === 1 ? '' : 's'}
              </span>
            {/if}
            {#if r.red_flags.length > 0}
              <span class="hud-chip text-hud-error">
                - {r.red_flags.length} red flag{r.red_flags.length === 1 ? '' : 's'}
              </span>
            {/if}
            <span class="hud-chip">
              CONF {r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : 'N/A'}
            </span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</Panel>

{#if activeSymbol && activeResearch}
  <DetailWindow
    open={true}
    minimized={detailsMinimized}
    minimizedIndex={0}
    title={`${activeSymbol} RESEARCH`}
    subtitle={`Analyzed ${new Date(activeResearch.timestamp).toLocaleTimeString('en-US', { hour12: false })}`}
    onClose={closeDetails}
    onMinimize={minimizeDetails}
    onRestore={restoreDetails}
  >
    <ResearchCardExpanded symbol={activeSymbol} research={activeResearch} />
  </DetailWindow>
{/if}
