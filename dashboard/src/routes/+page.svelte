<script lang="ts">
  import { onMount } from 'svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import Header from '$lib/components/Header.svelte'
  import AccountPanel from '$lib/components/AccountPanel.svelte'
  import PositionsPanel from '$lib/components/PositionsPanel.svelte'
  import CostsPanel from '$lib/components/CostsPanel.svelte'
  import PortfolioChart from '$lib/components/PortfolioChart.svelte'
  import PositionPerformance from '$lib/components/PositionPerformance.svelte'
  import SignalsPanel from '$lib/components/SignalsPanel.svelte'
  import ActivityFeed from '$lib/components/ActivityFeed.svelte'
  import ResearchPanel from '$lib/components/ResearchPanel.svelte'
  import DashboardFooter from '$lib/components/DashboardFooter.svelte'
  import ErrorScreen from '$lib/components/ErrorScreen.svelte'
  import SetupWizard from '$lib/components/SetupWizard.svelte'

  onMount(() => {
    dashboard.checkSetup()
    return () => dashboard.stopPolling()
  })

  // Start polling once setup check completes (or after setup wizard)
  $effect(() => {
    if (dashboard.setupChecked && !dashboard.showSetup) {
      dashboard.startPolling()
    }
  })
</script>

{#if dashboard.showSetup}
  <SetupWizard onComplete={() => dashboard.completeSetup()} />
{:else if dashboard.error && !dashboard.status}
  <ErrorScreen error={dashboard.error} />
{:else}
  <div class="min-h-screen bg-hud-bg">
    <div class="max-w-[1920px] mx-auto p-4">
      <Header />

      <div class="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
        <!-- Row 1: Account, Positions, LLM Costs -->
        <div class="col-span-4 md:col-span-4 lg:col-span-3">
          <AccountPanel />
        </div>
        <div class="col-span-4 md:col-span-4 lg:col-span-5">
          <PositionsPanel />
        </div>
        <div class="col-span-4 md:col-span-8 lg:col-span-4">
          <CostsPanel />
        </div>

        <!-- Row 2: Portfolio Performance Chart -->
        <div class="col-span-4 md:col-span-8 lg:col-span-8">
          <PortfolioChart />
        </div>
        <div class="col-span-4 md:col-span-8 lg:col-span-4">
          <PositionPerformance />
        </div>

        <!-- Row 3: Signals, Activity, Research -->
        <div class="col-span-4 md:col-span-4 lg:col-span-4">
          <SignalsPanel />
        </div>
        <div class="col-span-4 md:col-span-4 lg:col-span-4">
          <ActivityFeed />
        </div>
        <div class="col-span-4 md:col-span-8 lg:col-span-4">
          <ResearchPanel />
        </div>
      </div>

      <DashboardFooter />
    </div>

  </div>
{/if}
