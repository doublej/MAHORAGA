<script lang="ts">
  import { draw, fade } from 'svelte/transition'

  type ChartVariant = 'cyan' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'primary'

  interface Series {
    label: string
    data: number[]
    variant?: ChartVariant
  }

  const variantColors: Record<ChartVariant, { stroke: string; fill: string }> = {
    cyan: { stroke: 'var(--color-hud-cyan)', fill: 'var(--color-hud-cyan)' },
    blue: { stroke: 'var(--color-hud-blue)', fill: 'var(--color-hud-blue)' },
    green: { stroke: 'var(--color-hud-green)', fill: 'var(--color-hud-green)' },
    yellow: { stroke: 'var(--color-hud-yellow)', fill: 'var(--color-hud-yellow)' },
    red: { stroke: 'var(--color-hud-red)', fill: 'var(--color-hud-red)' },
    purple: { stroke: 'var(--color-hud-purple)', fill: 'var(--color-hud-purple)' },
    primary: { stroke: 'var(--color-hud-primary)', fill: 'var(--color-hud-primary)' },
  }

  let {
    series,
    labels,
    variant = 'cyan',
    height,
    showDots = false,
    showGrid = true,
    showArea = true,
    animated = true,
    formatValue,
  }: {
    series: Series[]
    labels?: string[]
    variant?: ChartVariant
    height?: number
    showDots?: boolean
    showGrid?: boolean
    showArea?: boolean
    animated?: boolean
    formatValue?: (value: number) => string
  } = $props()

  const viewBoxWidth = 800
  let viewBoxHeight = $derived(height || 200)
  const padding = { top: 16, right: 16, bottom: 28, left: 56 }
  let chartWidth = $derived(viewBoxWidth - padding.left - padding.right)
  let chartHeight = $derived(viewBoxHeight - padding.top - padding.bottom)

  let allValues = $derived(series.flatMap((s) => s.data))
  let dataMin = $derived(Math.min(...allValues))
  let dataMax = $derived(Math.max(...allValues))
  let range = $derived(dataMax - dataMin || 1)
  let minValue = $derived(dataMin - range * 0.05)
  let maxValue = $derived(dataMax + range * 0.05)
  let valueRange = $derived(maxValue - minValue || 1)
  let maxPoints = $derived(Math.max(...series.map((s) => s.data.length), 1))

  function getX(index: number) {
    return padding.left + (index / (maxPoints - 1 || 1)) * chartWidth
  }
  function getY(value: number) {
    return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight
  }

  let gridValues = $derived(
    Array.from({ length: 4 }, (_, i) => minValue + (valueRange / 3) * i),
  )

  let formatLabel = $derived(
    formatValue ||
      ((v: number) => {
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`
        return v.toFixed(0)
      }),
  )

  let labelIndices = $derived.by(() => {
    if (!labels) return []
    const step = Math.ceil(labels.length / 5)
    return labels.map((_, i) => i).filter((i) => i % step === 0)
  })
</script>

<svg
  width="100%"
  height="100%"
  viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
  preserveAspectRatio="xMidYMid meet"
  class="block"
>
  {#if showGrid}
    <g>
      {#each gridValues as value}
        <line
          x1={padding.left}
          y1={getY(value)}
          x2={viewBoxWidth - padding.right}
          y2={getY(value)}
          stroke="currentColor"
          class="text-hud-border"
          stroke-width="0.5"
          opacity="0.3"
        />
        <text
          x={padding.left - 8}
          y={getY(value)}
          text-anchor="end"
          dominant-baseline="middle"
          fill="currentColor"
          class="text-hud-text-dim"
          font-size="12"
        >
          {formatLabel(value)}
        </text>
      {/each}
    </g>
  {/if}

  {#if labels}
    <g>
      {#each labelIndices as idx}
        <text
          x={getX(idx)}
          y={viewBoxHeight - 8}
          text-anchor="middle"
          fill="currentColor"
          class="text-hud-text-dim"
          font-size="12"
        >
          {labels[idx]}
        </text>
      {/each}
    </g>
  {/if}

  {#each series as s, seriesIndex}
    {@const colors = variantColors[s.variant ?? variant]}
    {@const points = s.data.map((value, i) => ({ x: getX(i), y: getY(value) }))}
    {@const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
    {@const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartHeight} L ${points[0]?.x ?? 0} ${padding.top + chartHeight} Z`}

    {#if points.length > 0}
      <g>
        {#if showArea}
          <defs>
            <linearGradient id="area-gradient-{seriesIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color={colors.fill} stop-opacity="0.2" />
              <stop offset="100%" stop-color={colors.fill} stop-opacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaD}
            fill="url(#area-gradient-{seriesIndex})"
            transition:fade={{ duration: animated ? 800 : 0 }}
          />
        {/if}

        <path
          d={pathD}
          fill="none"
          stroke={colors.stroke}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.8"
          transition:draw={{ duration: animated ? 1200 : 0 }}
        />

        {#if showDots}
          {#each points as p}
            <circle cx={p.x} cy={p.y} r="2" fill={colors.fill} opacity="0.8" />
          {/each}
        {/if}
      </g>
    {/if}
  {/each}
</svg>
