<script lang="ts">
  import { dashboard } from '$lib/stores/dashboard.svelte'

  let uniqueAgents = $derived([...new Set(dashboard.fullLogs.map((log) => log.agent))].sort())
  let uniqueActions = $derived([...new Set(dashboard.fullLogs.map((log) => log.action))].sort())

  function updateFilter(key: 'agent' | 'action' | 'symbol', value: string) {
    if (value === '') {
      const { [key]: _, ...rest } = dashboard.logFilters
      dashboard.logFilters = rest
    } else {
      dashboard.logFilters = { ...dashboard.logFilters, [key]: value }
    }
  }

  function clearFilters() {
    dashboard.logFilters = {}
  }

  let hasFilters = $derived(Object.keys(dashboard.logFilters).length > 0)
</script>

<div class="border-b border-hud-line p-4">
  <div class="flex flex-wrap gap-3 items-center">
    <!-- Agent Filter -->
    <div class="flex items-center gap-2">
      <label class="hud-label text-hud-text-dim shrink-0" for="agent-filter">AGENT</label>
      <select
        id="agent-filter"
        class="hud-input text-xs py-1 px-2"
        value={dashboard.logFilters.agent || ''}
        onchange={(e) => updateFilter('agent', e.currentTarget.value)}
      >
        <option value="">All Agents</option>
        {#each uniqueAgents as agent}
          <option value={agent}>{agent}</option>
        {/each}
      </select>
    </div>

    <!-- Action Filter -->
    <div class="flex items-center gap-2">
      <label class="hud-label text-hud-text-dim shrink-0" for="action-filter">ACTION</label>
      <select
        id="action-filter"
        class="hud-input text-xs py-1 px-2"
        value={dashboard.logFilters.action || ''}
        onchange={(e) => updateFilter('action', e.currentTarget.value)}
      >
        <option value="">All Actions</option>
        {#each uniqueActions as action}
          <option value={action}>{action}</option>
        {/each}
      </select>
    </div>

    <!-- Symbol Search -->
    <div class="flex items-center gap-2">
      <label class="hud-label text-hud-text-dim shrink-0" for="symbol-filter">SYMBOL</label>
      <input
        id="symbol-filter"
        type="text"
        class="hud-input text-xs py-1 px-2 w-32"
        placeholder="Search..."
        value={dashboard.logFilters.symbol || ''}
        oninput={(e) => updateFilter('symbol', e.currentTarget.value)}
      />
    </div>

    <!-- Clear Filters -->
    {#if hasFilters}
      <button
        class="text-xs text-hud-error hover:text-hud-text-bright transition-colors uppercase tracking-wider ml-auto"
        onclick={clearFilters}
      >
        Clear Filters
      </button>
    {/if}
  </div>
</div>
