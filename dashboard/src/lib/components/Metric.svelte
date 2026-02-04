<script lang="ts">
  const sizeClasses: Record<string, string> = {
    sm: 'hud-value-sm',
    md: 'hud-value-md',
    lg: 'hud-value-lg',
    xl: 'hud-value-xl',
  }

  const colorClasses: Record<string, string> = {
    default: '',
    success: 'text-hud-success',
    warning: 'text-hud-warning',
    error: 'text-hud-error',
  }

  let {
    label,
    value,
    size = 'lg',
    color = 'default',
    class: className = '',
  }: {
    label: string
    value: string | number
    size?: 'sm' | 'md' | 'lg' | 'xl'
    color?: 'default' | 'success' | 'warning' | 'error'
    class?: string
  } = $props()
</script>

<div class="flex flex-col {className}">
  <span class="hud-label mb-1">{label}</span>
  <span class="{sizeClasses[size]} {colorClasses[color]}">{value}</span>
</div>
