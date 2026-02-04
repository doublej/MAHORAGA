<script lang="ts">
  import { clickOutside } from '$lib/actions/clickOutside'
  import { formatTime } from '$lib/utils'
  import { fade, fly } from 'svelte/transition'
  import type { OvernightActivity, PremarketPlan } from '$lib/types'

  let {
    overnightActivity,
    premarketPlan,
  }: {
    overnightActivity?: OvernightActivity
    premarketPlan?: PremarketPlan | null
  } = $props()

  let isOpen = $state(false)
  let hasRead = $state(false)

  let hasActivity = $derived(
    overnightActivity &&
      (overnightActivity.signalsGathered > 0 ||
        overnightActivity.signalsResearched > 0 ||
        overnightActivity.buySignals > 0),
  )

  let unreadCount = $derived(
    hasActivity && !hasRead
      ? (overnightActivity?.buySignals || 0) + (premarketPlan?.highConvictionPlays?.length || 0)
      : 0,
  )

  function toggle() {
    isOpen = !isOpen
    if (isOpen) hasRead = true
  }

  const stats = $derived([
    { label: 'SIGNALS FOUND', value: overnightActivity?.signalsGathered || 0, highlight: false },
    { label: 'RESEARCHED', value: overnightActivity?.signalsResearched || 0, highlight: false },
    { label: 'BUY SIGNALS', value: overnightActivity?.buySignals || 0, highlight: !!overnightActivity?.buySignals && overnightActivity.buySignals > 0 },
    { label: 'TWITTER CONF', value: overnightActivity?.twitterConfirmations || 0, highlight: false },
  ])
</script>

<div use:clickOutside={() => (isOpen = false)} class="relative">
  <button
    onclick={toggle}
    class="relative p-2 transition-colors {isOpen ? 'text-hud-primary' : 'text-hud-text-dim hover:text-hud-text'}"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class={unreadCount > 0 ? 'animate-pulse' : ''}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>

    {#if unreadCount > 0}
      <span
        class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-hud-error text-[9px] font-bold rounded-full flex items-center justify-center text-white"
        transition:fade={{ duration: 150 }}
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    {/if}
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 top-full mt-2 w-72 hud-panel z-50"
      transition:fly={{ y: -8, duration: 150 }}
    >
      <div class="px-3 py-2 border-b border-hud-line flex justify-between items-center">
        <span class="hud-label">OVERNIGHT ACTIVITY</span>
        {#if overnightActivity?.lastUpdated}
          <span class="text-[9px] text-hud-text-dim">{formatTime(overnightActivity.lastUpdated)}</span>
        {/if}
      </div>

      <div class="p-3 space-y-3">
        {#if !hasActivity}
          <div class="text-hud-text-dim text-xs text-center py-4">No overnight activity yet</div>
        {:else}
          <div class="grid grid-cols-2 gap-2">
            {#each stats as stat}
              <div class="text-center">
                <div class="text-lg font-light {stat.highlight ? 'text-hud-success' : 'text-hud-text-bright'}">{stat.value}</div>
                <div class="hud-label">{stat.label}</div>
              </div>
            {/each}
          </div>

          <div class="pt-2 border-t border-hud-line/50">
            <div class="flex items-center justify-between mb-2">
              <span class="hud-label">PRE-MARKET PLAN</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded {overnightActivity?.premarketPlanReady ? 'bg-hud-success/20 text-hud-success' : 'bg-hud-text-dim/20 text-hud-text-dim'}">
                {overnightActivity?.premarketPlanReady ? 'READY' : 'PENDING'}
              </span>
            </div>

            {#if premarketPlan && premarketPlan.highConvictionPlays?.length > 0}
              <div class="space-y-1">
                <span class="text-[9px] text-hud-text-dim">HIGH CONVICTION:</span>
                <div class="flex flex-wrap gap-1">
                  {#each premarketPlan.highConvictionPlays as symbol}
                    <span class="text-xs px-1.5 py-0.5 bg-hud-success/10 text-hud-success border border-hud-success/30 rounded">
                      {symbol}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}

            {#if premarketPlan?.marketOutlook}
              <p class="text-[10px] text-hud-text-dim mt-2 leading-tight">
                {premarketPlan.marketOutlook.slice(0, 100)}{premarketPlan.marketOutlook.length > 100 ? '...' : ''}
              </p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
