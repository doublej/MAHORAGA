<script lang="ts">
  import Panel from './Panel.svelte'
  import Metric from './Metric.svelte'
  import MetricInline from './MetricInline.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { formatCurrency, formatPercent } from '$lib/utils'
</script>

<Panel title="ACCOUNT" class="h-full">
  {#if dashboard.account}
    <div class="space-y-4">
      <Metric label="EQUITY" value={formatCurrency(dashboard.account.equity)} size="xl" />
      <div class="grid grid-cols-2 gap-4">
        <Metric label="CASH" value={formatCurrency(dashboard.account.cash)} size="md" />
        <Metric label="BUYING POWER" value={formatCurrency(dashboard.account.buying_power)} size="md" />
      </div>
      <div class="pt-2 border-t border-hud-line space-y-2">
        <Metric
          label="TOTAL P&L"
          value="{formatCurrency(dashboard.totalPl)} ({formatPercent(dashboard.totalPlPct)})"
          size="md"
          color={dashboard.totalPl >= 0 ? 'success' : 'error'}
        />
        <div class="grid grid-cols-2 gap-2">
          <MetricInline
            label="REALIZED"
            value={formatCurrency(dashboard.realizedPl)}
            color={dashboard.realizedPl >= 0 ? 'success' : 'error'}
          />
          <MetricInline
            label="UNREALIZED"
            value={formatCurrency(dashboard.unrealizedPl)}
            color={dashboard.unrealizedPl >= 0 ? 'success' : 'error'}
          />
        </div>
      </div>
    </div>
  {:else}
    <div class="text-hud-text-dim text-sm">Loading...</div>
  {/if}
</Panel>
