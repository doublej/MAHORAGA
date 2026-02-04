<script lang="ts">
  const colorClasses: Record<string, string> = {
    default: '',
    success: 'text-hud-success',
    warning: 'text-hud-warning',
    error: 'text-hud-error',
  }

  let {
    label,
    value,
    color = 'default',
    valueClassName = '',
    class: className = '',
  }: {
    label: string
    value: string | number
    color?: 'default' | 'success' | 'warning' | 'error'
    valueClassName?: string
    class?: string
  } = $props()
</script>

<div class="flex items-baseline gap-2 {className}">
  <span class="hud-label">{label}</span>
  <span class="hud-value-sm {valueClassName || colorClasses[color]}">{value}</span>
</div>
