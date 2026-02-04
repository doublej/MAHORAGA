<script lang="ts">
  const statusColors: Record<string, string> = {
    active: 'bg-hud-success',
    warning: 'bg-hud-warning',
    error: 'bg-hud-error',
    inactive: 'bg-hud-dim',
  }

  let {
    status,
    label,
    pulse = false,
    class: className = '',
  }: {
    status: 'active' | 'warning' | 'error' | 'inactive'
    label?: string
    pulse?: boolean
    class?: string
  } = $props()
</script>

<div class="flex items-center gap-2 {className}">
  <div class="relative">
    <div class="w-2 h-2 rounded-full {statusColors[status]}"></div>
    {#if pulse && status === 'active'}
      <div class="absolute inset-0 w-2 h-2 rounded-full animate-ping {statusColors[status]} opacity-75"></div>
    {/if}
  </div>
  {#if label}
    <span class="hud-label">{label}</span>
  {/if}
</div>
