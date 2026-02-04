<script lang="ts">
  import Panel from './Panel.svelte'
  import LineChart from './LineChart.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { formatPercent } from '$lib/utils'

  const positionColors = ['cyan', 'purple', 'yellow', 'blue', 'green'] as const
</script>

<Panel title="POSITION PERFORMANCE" titleRight="% CHANGE" class="h-[320px]">
  {#if dashboard.positions.length === 0}
    <div class="h-full flex items-center justify-center text-hud-text-dim text-sm">
      No positions to display
    </div>
  {:else if dashboard.normalizedPositionSeries.length > 0}
    <div class="h-full flex flex-col">
      <div class="flex flex-wrap gap-3 mb-2 pb-2 border-b border-hud-line/30 shrink-0">
        {#each dashboard.positions.slice(0, 5) as pos, idx}
          {@const isPositive = pos.unrealized_pl >= 0}
          {@const plPct = (pos.unrealized_pl / (pos.market_value - pos.unrealized_pl)) * 100}
          {@const color = positionColors[idx % positionColors.length]}
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full" style="background-color: var(--color-hud-{color})"></div>
            <span class="hud-value-sm">{pos.symbol}</span>
            <span class="hud-label {isPositive ? 'text-hud-success' : 'text-hud-error'}">
              {formatPercent(plPct)}
            </span>
          </div>
        {/each}
      </div>
      <div class="flex-1 min-h-0 w-full">
        <LineChart
          series={dashboard.normalizedPositionSeries.slice(0, 5)}
          showArea={false}
          showGrid={true}
          showDots={false}
          animated={false}
          formatValue={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
        />
      </div>
    </div>
  {:else}
    <div class="h-full flex items-center justify-center text-hud-text-dim text-sm">
      Loading position data...
    </div>
  {/if}
</Panel>
