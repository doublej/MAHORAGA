<script lang="ts">
  import Panel from './Panel.svelte'
  import Tooltip from './Tooltip.svelte'
  import LogDetailsTooltip from './LogDetailsTooltip.svelte'
  import LogsModal from './LogsModal.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getAgentColor } from '$lib/utils'
  import { formatCurrency } from '$lib/utils'
  import { autoScroll } from '$lib/actions/autoScroll'
  import { fade } from 'svelte/transition'

  let showLogsModal = $state(false)

  const detailOrder = [
    'symbol',
    'count',
    'confidence',
    'verdict',
    'status',
    'pnl',
    'price',
    'reason',
    'message',
    'error',
  ]

  const detailLabels: Record<string, string> = {
    symbol: 'SYM',
    count: 'CT',
    confidence: 'CONF',
    verdict: 'VERD',
    status: 'STATUS',
    pnl: 'P&L',
    price: 'PX',
    reason: 'WHY',
    message: 'MSG',
    error: 'ERR',
  }

  function hasDetails(log: any) {
    const { timestamp, agent, action, symbol, ...details } = log
    return Object.keys(details).length > 0
  }

  function formatDetailValue(key: string, value: unknown): { text: string; color?: string } | null {
    if (value === null || value === undefined) return null
    const lowerKey = key.toLowerCase()

    if (typeof value === 'number') {
      if (lowerKey.includes('confidence') || lowerKey.includes('pct') || lowerKey.includes('percent')) {
        const scaled = Math.abs(value) <= 1 ? value * 100 : value
        return { text: `${scaled.toFixed(1)}%` }
      }
      if (lowerKey.includes('pnl') || lowerKey.includes('pl')) {
        return {
          text: `${value >= 0 ? '+' : ''}${value.toFixed(2)}`,
          color: value >= 0 ? 'text-hud-success' : 'text-hud-error',
        }
      }
      if (lowerKey.includes('price')) {
        return { text: formatCurrency(value) }
      }
      return { text: value.toLocaleString() }
    }

    if (typeof value === 'boolean') {
      return { text: value ? 'YES' : 'NO' }
    }

    const stringValue = Array.isArray(value) ? value.join(', ') : String(value)
    const trimmed = stringValue.length > 60 ? `${stringValue.slice(0, 60)}…` : stringValue

    if (lowerKey.includes('error')) return { text: trimmed, color: 'text-hud-error' }
    if (lowerKey.includes('message')) return { text: trimmed, color: 'text-hud-text-dim' }
    if (lowerKey.includes('verdict')) {
      const verdict = trimmed.toUpperCase()
      if (verdict === 'BUY') return { text: verdict, color: 'text-hud-success' }
      if (verdict === 'SELL' || verdict === 'SKIP') return { text: verdict, color: 'text-hud-error' }
      return { text: verdict, color: 'text-hud-warning' }
    }

    return { text: trimmed }
  }

  function getDetailChips(log: any): Array<{ label: string; value: string; color?: string }> {
    const { timestamp, agent, action, ...rest } = log
    const entries = Object.entries(rest)
      .filter(([key]) => detailOrder.includes(key))
      .sort(([a], [b]) => detailOrder.indexOf(a) - detailOrder.indexOf(b))

    const chips: Array<{ label: string; value: string; color?: string }> = []
    for (const [key, value] of entries) {
      const formatted = formatDetailValue(key, value)
      if (!formatted) continue
      chips.push({
        label: detailLabels[key] || key.toUpperCase(),
        value: formatted.text,
        color: formatted.color,
      })
      if (chips.length >= 4) break
    }
    return chips
  }

  function openLogsModal() {
    showLogsModal = true
  }

  function closeLogsModal() {
    showLogsModal = false
  }

  const activitySummary = $derived(() => {
    const now = dashboard.time.getTime()
    const oneMinuteAgo = now - 60_000
    const fiveMinutesAgo = now - 300_000
    let events1m = 0
    let events5m = 0
    let errors5m = 0
    const agents = new Set<string>()

    for (const log of dashboard.logs) {
      const ts = new Date(log.timestamp).getTime()
      if (ts >= oneMinuteAgo) events1m += 1
      if (ts >= fiveMinutesAgo) {
        events5m += 1
        if (log.agent) agents.add(log.agent)
        const action = String(log.action || '').toLowerCase()
        const errorText = String((log as any).error || (log as any).message || '').toLowerCase()
        if (action.includes('error') || errorText.includes('error')) errors5m += 1
      }
    }

    return { events1m, events5m, activeAgents: agents.size, errors5m }
  })
</script>

<div class="hud-panel flex flex-col h-80">
  <div class="flex justify-between items-center px-4 py-2 border-b border-hud-line shrink-0">
    <span class="hud-label">ACTIVITY FEED</span>
    <div class="flex items-center gap-3">
      <span class="hud-label">LIVE</span>
      <button
        class="text-[10px] text-hud-primary hover:text-hud-text-bright transition-colors uppercase tracking-wider cursor-pointer"
        onclick={openLogsModal}
      >
        View All
      </button>
    </div>
  </div>
  <div class="px-4 py-2 border-b border-hud-line/30">
    <div class="flex flex-wrap gap-3 text-[10px] text-hud-text-dim">
      <span class="hud-kv"><span>EVENTS (1M)</span><span class="hud-nums text-hud-text-bright">{activitySummary().events1m}</span></span>
      <span class="hud-kv"><span>EVENTS (5M)</span><span class="hud-nums text-hud-text-bright">{activitySummary().events5m}</span></span>
      <span class="hud-kv"><span>ACTIVE AGENTS</span><span class="hud-nums text-hud-text-bright">{activitySummary().activeAgents}</span></span>
      <span class="hud-kv"><span>ERRORS (5M)</span><span class="hud-nums text-hud-error">{activitySummary().errors5m}</span></span>
    </div>
  </div>
  <div class="flex-1 min-h-0 p-3">
    <div class="overflow-y-auto h-full font-mono text-xs space-y-1" use:autoScroll>
    {#if dashboard.logs.length === 0}
      <div class="text-hud-text-dim py-4 text-center">Waiting for activity...</div>
    {:else}
      {#each dashboard.logs.slice(-200) as log, i (`${log.timestamp}-${i}`)}
        {@const chips = getDetailChips(log)}
        <Tooltip position="right">
          {#snippet children()}
            <div
              class="py-2 px-2 cursor-help hud-row"
              transition:fade={{ duration: 200 }}
            >
              <div class="grid grid-cols-[64px_84px_minmax(0,1fr)] gap-2 items-start">
                <span class="text-hud-text-dim shrink-0 hidden sm:inline">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span class="shrink-0 text-right {getAgentColor(log.agent)}">
                  {log.agent}
                </span>
                <span class="text-hud-text min-w-0 break-words line-clamp-2">
                  {log.action}
                  {#if log.symbol}<span class="text-hud-primary ml-1">({log.symbol})</span>{/if}
                  {#if hasDetails(log)}<span class="text-hud-primary ml-1">•</span>{/if}
                </span>
              </div>
              {#if chips.length > 0}
                <div class="mt-1 flex flex-wrap gap-1 text-[10px]">
                  {#each chips as chip}
                    <span class="hud-chip {chip.color || ''}">
                      <span class="text-hud-text-dim">{chip.label}</span>
                      <span class="hud-nums">{chip.value}</span>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/snippet}
          {#snippet content()}
            <LogDetailsTooltip {log} />
          {/snippet}
        </Tooltip>
      {/each}
    {/if}
    </div>
  </div>
</div>

{#if showLogsModal}
  <LogsModal onClose={closeLogsModal} />
{/if}
