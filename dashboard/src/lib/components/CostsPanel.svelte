<script lang="ts">
  import Panel from './Panel.svelte'
  import Metric from './Metric.svelte'
  import MetricInline from './MetricInline.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
</script>

<Panel title="LLM COSTS" class="h-full">
  <div class="grid grid-cols-2 gap-4">
    <Metric label="TOTAL SPENT" value="${dashboard.costs.total_usd.toFixed(4)}" size="lg" />
    <Metric label="API CALLS" value={dashboard.costs.calls.toString()} size="lg" />
    <MetricInline label="TOKENS IN" value={dashboard.costs.tokens_in.toLocaleString()} />
    <MetricInline label="TOKENS OUT" value={dashboard.costs.tokens_out.toLocaleString()} />
    <MetricInline
      label="AVG COST/CALL"
      value={dashboard.costs.calls > 0 ? `$${(dashboard.costs.total_usd / dashboard.costs.calls).toFixed(6)}` : '$0'}
    />
    <MetricInline label="MODEL" value={dashboard.config?.llm_model || 'gpt-4o-mini'} />
  </div>
</Panel>
