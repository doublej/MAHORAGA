<script lang="ts">
  import Panel from './Panel.svelte'
  import Tooltip from './Tooltip.svelte'
  import LogDetailsTooltip from './LogDetailsTooltip.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getAgentColor } from '$lib/utils'
  import { autoScroll } from '$lib/actions/autoScroll'
  import { fade } from 'svelte/transition'

  function hasDetails(log: any) {
    const { timestamp, agent, action, symbol, ...details } = log
    return Object.keys(details).length > 0
  }
</script>

<Panel title="ACTIVITY FEED" titleRight="LIVE" class="h-80">
  <div class="overflow-y-auto h-full font-mono text-xs space-y-1" use:autoScroll>
    {#if dashboard.logs.length === 0}
      <div class="text-hud-text-dim py-4 text-center">Waiting for activity...</div>
    {:else}
      {#each dashboard.logs.slice(-50) as log, i (`${log.timestamp}-${i}`)}
        <Tooltip position="right">
          {#snippet children()}
            <div
              class="flex items-start gap-2 py-1 border-b border-hud-line/10 hover:bg-hud-line/5 cursor-help"
              transition:fade={{ duration: 200 }}
            >
              <span class="text-hud-text-dim shrink-0 hidden sm:inline w-[52px]">
                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span class="shrink-0 w-[72px] text-right {getAgentColor(log.agent)}">
                {log.agent}
              </span>
              <span class="text-hud-text flex-1 text-right wrap-break-word">
                {log.action}
                {#if log.symbol}<span class="text-hud-primary ml-1">({log.symbol})</span>{/if}
                {#if hasDetails(log)}<span class="text-hud-primary ml-1">•</span>{/if}
              </span>
            </div>
          {/snippet}
          {#snippet content()}
            <LogDetailsTooltip {log} />
          {/snippet}
        </Tooltip>
      {/each}
    {/if}
  </div>
</Panel>
