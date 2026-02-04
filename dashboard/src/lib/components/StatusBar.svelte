<script lang="ts">
  const statusColors: Record<string, string> = {
    active: 'bg-hud-success',
    warning: 'bg-hud-warning',
    error: 'bg-hud-error',
    inactive: 'bg-hud-dim',
  }

  let {
    items,
    class: className = '',
  }: {
    items: Array<{
      label: string
      value: string | number
      status?: 'active' | 'warning' | 'error' | 'inactive'
    }>
    class?: string
  } = $props()
</script>

<div class="flex items-center gap-6 {className}">
  {#each items as item}
    <div class="flex items-center gap-2">
      {#if item.status}
        <div class="w-2 h-2 rounded-full {statusColors[item.status]}"></div>
      {/if}
      <span class="hud-label">{item.label}</span>
      <span class="hud-value-sm">{item.value}</span>
    </div>
  {/each}
</div>
