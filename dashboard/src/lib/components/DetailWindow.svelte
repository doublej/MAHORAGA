<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { Snippet } from 'svelte'
  import { fade, fly } from 'svelte/transition'

  let {
    children,
    title,
    subtitle = '',
    open,
    minimized = false,
    minimizedIndex = 0,
    zIndex = 70,
    onClose,
    onMinimize,
    onRestore,
  }: {
    children: Snippet
    title: string
    subtitle?: string
    open: boolean
    minimized?: boolean
    minimizedIndex?: number
    zIndex?: number
    onClose: () => void
    onMinimize: () => void
    onRestore: () => void
  } = $props()

  let windowEl: HTMLElement | null = $state(null)
  let headerEl: HTMLElement | null = $state(null)
  let pointerId = $state<number | null>(null)
  let dragOffset = $state({ x: 0, y: 0 })
  let draggedPosition = $state<{ x: number; y: number } | null>(null)
  let isDragging = $state(false)
  let compactViewport = $state(false)

  function updateViewportMode() {
    compactViewport = window.innerWidth <= 640
    if (compactViewport) {
      isDragging = false
      pointerId = null
    }
  }

  function clampPosition(x: number, y: number): { x: number; y: number } {
    if (!windowEl) return { x, y }
    const margin = 8
    const maxX = Math.max(margin, window.innerWidth - windowEl.offsetWidth - margin)
    const maxY = Math.max(margin, window.innerHeight - windowEl.offsetHeight - margin)

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    }
  }

  function handleHeaderPointerDown(event: PointerEvent) {
    if (compactViewport || event.button !== 0 || !windowEl || !headerEl) return
    const target = event.target as HTMLElement | null
    if (target?.closest('button')) return

    const rect = windowEl.getBoundingClientRect()
    const baseX = draggedPosition?.x ?? rect.left
    const baseY = draggedPosition?.y ?? rect.top

    dragOffset = { x: event.clientX - baseX, y: event.clientY - baseY }
    draggedPosition = { x: baseX, y: baseY }
    pointerId = event.pointerId
    isDragging = true

    headerEl.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handleHeaderPointerMove(event: PointerEvent) {
    if (!isDragging || pointerId !== event.pointerId || compactViewport) return
    const nextX = event.clientX - dragOffset.x
    const nextY = event.clientY - dragOffset.y
    draggedPosition = clampPosition(nextX, nextY)
  }

  function handleHeaderPointerUp(event: PointerEvent) {
    if (pointerId !== event.pointerId) return
    if (headerEl?.hasPointerCapture(event.pointerId)) {
      headerEl.releasePointerCapture(event.pointerId)
    }
    isDragging = false
    pointerId = null
  }

  function getWindowStyle() {
    let style = `z-index:${zIndex};`
    if (!compactViewport && draggedPosition) {
      style += `left:${draggedPosition.x}px;top:${draggedPosition.y}px;right:auto;bottom:auto;`
    }
    return style
  }

  onMount(() => {
    updateViewportMode()
    window.addEventListener('resize', updateViewportMode)
  })

  onDestroy(() => {
    window.removeEventListener('resize', updateViewportMode)
  })
</script>

{#if open && !minimized}
  <section
    bind:this={windowEl}
    class="detail-window"
    style={getWindowStyle()}
    aria-label={title}
    transition:fly={{ y: 8, duration: 150 }}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <header
      bind:this={headerEl}
      class="detail-window-header {!compactViewport ? 'detail-window-header-draggable' : ''} {isDragging ? 'detail-window-header-dragging' : ''}"
      onpointerdown={handleHeaderPointerDown}
      onpointermove={handleHeaderPointerMove}
      onpointerup={handleHeaderPointerUp}
      onpointercancel={handleHeaderPointerUp}
    >
      <div class="min-w-0">
        <div class="hud-label text-hud-primary truncate">{title}</div>
        {#if subtitle}
          <div class="text-[10px] text-hud-text-dim mt-1 truncate">{subtitle}</div>
        {/if}
      </div>
      <div class="detail-window-actions">
        <button
          class="detail-window-btn"
          onclick={onMinimize}
          aria-label="Minimize detail window"
          title="Minimize"
        >
          _
        </button>
        <button
          class="detail-window-btn"
          onclick={onClose}
          aria-label="Close detail window"
          title="Close"
        >
          ×
        </button>
      </div>
    </header>
    <div class="detail-window-body">
      {@render children()}
    </div>
  </section>
{/if}

{#if open && minimized}
  <button
    class="detail-window-dock"
    style={`z-index:${zIndex}; right: calc(0.75rem + (${minimizedIndex} * 12rem));`}
    onclick={onRestore}
    aria-label={`Restore ${title} window`}
    transition:fade={{ duration: 120 }}
  >
    <span class="truncate">{title}</span>
  </button>
{/if}
