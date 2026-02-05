<script lang="ts">
  import StatusIndicator from './StatusIndicator.svelte'
  import StatusBar from './StatusBar.svelte'
  import NotificationBell from './NotificationBell.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'

  let timeStr = $derived(dashboard.time.toLocaleTimeString('en-US', { hour12: false }))
</script>

<header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-3 sm:mb-4 pb-3 border-b border-hud-line">
  <div class="flex items-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
    <div class="flex items-baseline gap-2">
      <span class="text-xl md:text-2xl font-light tracking-tight text-hud-text-bright">MAHORAGA</span>
      <span class="hud-label">v2</span>
    </div>
    <StatusIndicator
      status={dashboard.isMarketOpen ? 'active' : 'inactive'}
      label={dashboard.isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
      pulse={dashboard.isMarketOpen}
    />
  </div>
  <div class="flex w-full lg:w-auto items-center gap-2 sm:gap-3 md:gap-6 flex-wrap">
    <StatusBar
      items={[
        { label: 'LLM COST', value: `$${dashboard.costs.total_usd.toFixed(4)}`, status: dashboard.costs.total_usd > 1 ? 'warning' : 'active' },
        { label: 'API CALLS', value: dashboard.costs.calls.toString() },
      ]}
    />
    <NotificationBell
      overnightActivity={dashboard.status?.overnightActivity}
      premarketPlan={dashboard.status?.premarketPlan}
    />
    <a
      href="/settings"
      class="hud-label hover:text-hud-primary transition-colors"
    >
      [CONFIG]
    </a>
    <span class="hud-value-sm font-mono">{timeStr}</span>
  </div>
</header>
