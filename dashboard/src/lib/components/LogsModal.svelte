<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import LogFilters from './LogFilters.svelte'
  import LogDetailsTooltip from './LogDetailsTooltip.svelte'
  import Tooltip from './Tooltip.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getAgentColor } from '$lib/utils'
  import type { LogEntry } from '$lib/types'

  interface Props {
    onClose: () => void
  }

  let { onClose }: Props = $props()

  let pollInterval: ReturnType<typeof setInterval> | null = null
  let expandedLogIndex = $state<number | null>(null)

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose()
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  function hasDetails(log: LogEntry) {
    const { timestamp, agent, action, symbol, ...details } = log
    return Object.keys(details).length > 0
  }

  function toggleExpand(index: number) {
    expandedLogIndex = expandedLogIndex === index ? null : index
  }

  onMount(() => {
    // Load full logs initially
    dashboard.fetchFullLogs(1000)

    // Poll for updates every 5 seconds
    pollInterval = setInterval(() => {
      dashboard.fetchFullLogs(1000)
    }, 5000)

    // Add keyboard listener
    window.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval)
    window.removeEventListener('keydown', handleKeydown)
  })

  let filteredLogs = $derived(dashboard.filteredLogs)
</script>

<div class="modal-backdrop" onclick={handleBackdropClick} transition:fade={{ duration: 200 }}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <div>
        <h2 class="hud-label text-lg">ACTIVITY LOGS</h2>
        <p class="text-xs text-hud-text-dim mt-1">
          Showing {filteredLogs.length} of {dashboard.fullLogs.length} logs
        </p>
      </div>
      <button class="modal-close" onclick={onClose} aria-label="Close modal">
        ×
      </button>
    </div>

    <div class="modal-body">
      <!-- Filters -->
      <LogFilters />

      <!-- Logs List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs">
        {#if filteredLogs.length === 0}
          <div class="text-hud-text-dim py-8 text-center">
            {dashboard.fullLogs.length === 0 ? 'No logs available' : 'No logs match the current filters'}
          </div>
        {:else}
          {#each filteredLogs as log, i (i)}
            <div class="border-b border-hud-line/10">
              <Tooltip position="right">
                {#snippet children()}
                  <div
                    class="flex items-start gap-2 py-1 hover:bg-hud-line/5 cursor-pointer"
                    onclick={() => toggleExpand(i)}
                    role="button"
                    tabindex="0"
                  >
                    <span class="text-hud-text-dim shrink-0 w-[65px]">
                      {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                    </span>
                    <span class="shrink-0 w-[80px] text-right {getAgentColor(log.agent)}">
                      {log.agent}
                    </span>
                    <span class="text-hud-text flex-1 text-right">
                      {log.action}
                      {#if log.symbol}
                        <span class="text-hud-primary ml-1">({log.symbol})</span>
                      {/if}
                      {#if hasDetails(log)}
                        <span class="text-hud-primary ml-1">•</span>
                      {/if}
                    </span>
                    <span class="text-hud-text-dim text-xs shrink-0">
                      {expandedLogIndex === i ? '⌃' : '⌄'}
                    </span>
                  </div>
                {/snippet}
                {#snippet content()}
                  <LogDetailsTooltip {log} />
                {/snippet}
              </Tooltip>

              {#if expandedLogIndex === i && hasDetails(log)}
                <div class="bg-hud-bg/50 p-2 mb-1 text-xs">
                  <LogDetailsTooltip {log} />
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>
