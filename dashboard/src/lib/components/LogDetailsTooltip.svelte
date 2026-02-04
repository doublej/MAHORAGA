<script lang="ts">
  import { dashboard } from '$lib/stores/dashboard.svelte'

  let { log }: { log: any } = $props()

  // Extract detail fields (everything except base fields)
  const details = $derived(() => {
    const { timestamp, agent, action, symbol, ...rest } = log
    return rest
  })

  // Format values for display
  function formatValue(key: string, value: any): string {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    if (typeof value === 'number') {
      if (key.includes('pct') || key.includes('confidence')) {
        return `${(value * 100).toFixed(1)}%`
      }
      return value.toLocaleString()
    }
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Get related research if symbol exists
  const research = $derived(
    log.symbol && dashboard.status?.signalResearch?.[log.symbol]
  )

  const positionEntry = $derived(
    log.symbol && dashboard.status?.positionEntries?.[log.symbol]
  )
</script>

<div class="space-y-2 max-w-md">
  <div class="font-bold text-hud-primary">
    {log.agent?.toUpperCase() || 'N/A'} - {log.action?.toUpperCase() || 'N/A'}
  </div>

  <div class="border-t border-hud-line pt-2 space-y-1">
    {#each Object.entries(details()) as [key, value]}
      <div class="flex justify-between gap-4">
        <span class="text-hud-text-dim">{key}:</span>
        <span class="text-hud-text text-right font-mono">{formatValue(key, value)}</span>
      </div>
    {/each}
  </div>

  {#if research}
    <div class="border-t border-hud-line pt-2">
      <div class="text-hud-warning text-xs">RESEARCH CONTEXT</div>
      <div class="text-xs space-y-1 mt-1">
        <div>Verdict: {research.verdict} ({(research.confidence * 100).toFixed(0)}%)</div>
        {#if research.reasoning}
          <div class="text-hud-text-dim">{research.reasoning}</div>
        {/if}
      </div>
    </div>
  {/if}

  {#if positionEntry}
    <div class="border-t border-hud-line pt-2">
      <div class="text-hud-success text-xs">POSITION ENTRY</div>
      <div class="text-xs space-y-1 mt-1">
        <div>Entry: ${positionEntry.entry_price}</div>
        <div>Time: {new Date(positionEntry.entry_time).toLocaleString()}</div>
      </div>
    </div>
  {/if}
</div>
