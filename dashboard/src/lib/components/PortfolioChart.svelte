<script lang="ts">
  import Panel from './Panel.svelte'
  import LineChart from './LineChart.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
</script>

<Panel title="PORTFOLIO PERFORMANCE" titleRight="24H" class="h-[260px] sm:h-[320px]">
  {#if dashboard.portfolioChartData.length > 1}
    <div class="h-full w-full">
      <LineChart
        series={[{ label: 'Equity', data: dashboard.portfolioChartData, variant: dashboard.totalPl >= 0 ? 'green' : 'red' }]}
        labels={dashboard.portfolioChartLabels}
        showArea={true}
        showGrid={true}
        showDots={false}
        formatValue={(v) => `$${(v / 1000).toFixed(1)}k`}
      />
    </div>
  {:else}
    <div class="h-full flex items-center justify-center text-hud-text-dim text-sm">
      Collecting performance data...
    </div>
  {/if}
</Panel>
