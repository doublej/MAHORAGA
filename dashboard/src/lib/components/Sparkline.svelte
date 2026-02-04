<script lang="ts">
  type ChartVariant = 'cyan' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'primary'

  const variantColors: Record<ChartVariant, { stroke: string }> = {
    cyan: { stroke: 'var(--color-hud-cyan)' },
    blue: { stroke: 'var(--color-hud-blue)' },
    green: { stroke: 'var(--color-hud-green)' },
    yellow: { stroke: 'var(--color-hud-yellow)' },
    red: { stroke: 'var(--color-hud-red)' },
    purple: { stroke: 'var(--color-hud-purple)' },
    primary: { stroke: 'var(--color-hud-primary)' },
  }

  let {
    data,
    width = 80,
    height = 24,
  }: {
    data: number[]
    width?: number
    height?: number
    variant?: ChartVariant
  } = $props()

  let pad = 2
  let chartWidth = $derived(width - pad * 2)
  let chartHeight = $derived(height - pad * 2)
  let minValue = $derived(Math.min(...data))
  let maxValue = $derived(Math.max(...data))
  let valueRange = $derived(maxValue - minValue || 1)

  let pathD = $derived.by(() => {
    if (data.length < 2) return ''
    return data
      .map((value, i) => {
        const x = pad + (i / (data.length - 1)) * chartWidth
        const y = pad + chartHeight - ((value - minValue) / valueRange) * chartHeight
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  })

  let isPositive = $derived(data.length >= 2 && data[data.length - 1] >= data[0])
  let strokeColor = $derived(isPositive ? variantColors.green.stroke : variantColors.red.stroke)
</script>

{#if data.length >= 2}
  <svg {width} {height}>
    <path
      d={pathD}
      fill="none"
      stroke={strokeColor}
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{/if}
