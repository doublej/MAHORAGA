<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { fade } from 'svelte/transition'
  import LogFilters from './LogFilters.svelte'
  import LogDetailsTooltip from './LogDetailsTooltip.svelte'
  import DetailWindow from './DetailWindow.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { getAgentColor } from '$lib/utils'
  import type { LogEntry } from '$lib/types'

  interface Props {
    onClose: () => void
  }

  let { onClose }: Props = $props()

  let pollInterval: ReturnType<typeof setInterval> | null = null
  let selectedLog = $state<LogEntry | null>(null)
  let detailsMinimized = $state(false)

  function closeModal() {
    selectedLog = null
    detailsMinimized = false
    onClose()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    if (selectedLog) {
      selectedLog = null
      detailsMinimized = false
      return
    }
    closeModal()
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }

  function hasDetails(log: LogEntry) {
    const { timestamp, agent, action, symbol, ...details } = log
    return Object.keys(details).length > 0
  }

  function openDetails(log: LogEntry) {
    selectedLog = log
    detailsMinimized = false
  }

  function closeDetails() {
    selectedLog = null
    detailsMinimized = false
  }

  function minimizeDetails() {
    if (!selectedLog) return
    detailsMinimized = true
  }

  function restoreDetails() {
    detailsMinimized = false
  }

  onMount(() => {
    dashboard.fetchFullLogs(1000)

    pollInterval = setInterval(() => {
      dashboard.fetchFullLogs(1000)
    }, 5000)

    window.addEventListener('keydown', handleKeydown)
  })

  onDestroy(() => {
    if (pollInterval) clearInterval(pollInterval)
    window.removeEventListener('keydown', handleKeydown)
  })

  let filteredLogs = $derived(dashboard.filteredLogs)
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick} transition:fade={{ duration: 200 }}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <div>
        <h2 class="hud-label text-lg">ACTIVITY LOGS</h2>
        <p class="text-xs text-hud-text-dim mt-1">
          Showing {filteredLogs.length} of {dashboard.fullLogs.length} logs
        </p>
      </div>
      <button class="modal-close" onclick={closeModal} aria-label="Close modal">
        ×
      </button>
    </div>

    <div class="modal-body">
      <LogFilters />

      <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 font-mono text-xs">
        {#if filteredLogs.length === 0}
          <div class="text-hud-text-dim py-8 text-center">
            {dashboard.fullLogs.length === 0 ? 'No logs available' : 'No logs match the current filters'}
          </div>
        {:else}
          {#each filteredLogs as log, i (i)}
            <button
              type="button"
              class="w-full border-b border-hud-line/10 py-1.5 text-left hover:bg-hud-line/5 cursor-pointer"
              onclick={() => openDetails(log)}
            >
              <div class="flex items-start gap-2">
                <span class="text-hud-text-dim shrink-0 w-[56px] sm:w-[65px]">
                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 break-words">
                      <span class="mr-1 {getAgentColor(log.agent)}">{log.agent}</span>
                      <span class="text-hud-text">
                        {log.action}
                        {#if log.symbol}
                          <span class="text-hud-primary ml-1">({log.symbol})</span>
                        {/if}
                      </span>
                    </div>
                    {#if hasDetails(log)}
                      <span class="hud-label text-hud-primary shrink-0">DETAILS</span>
                    {/if}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div>

{#if selectedLog}
  <DetailWindow
    open={true}
    minimized={detailsMinimized}
    minimizedIndex={3}
    zIndex={85}
    title={`${selectedLog.agent?.toUpperCase() || 'LOG'} DETAILS`}
    subtitle={new Date(selectedLog.timestamp).toLocaleString('en-US', { hour12: false })}
    onClose={closeDetails}
    onMinimize={minimizeDetails}
    onRestore={restoreDetails}
  >
    <LogDetailsTooltip log={selectedLog} />
  </DetailWindow>
{/if}
