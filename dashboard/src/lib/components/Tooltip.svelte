<script lang="ts">
  import type { Snippet } from 'svelte'
  import { fade } from 'svelte/transition'

  let {
    children,
    content,
    position = 'top',
    delay = 200,
  }: {
    children: Snippet
    content: Snippet
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
  } = $props()

  let visible = $state(false)
  let coords = $state({ top: 0, left: 0 })
  let triggerEl: HTMLDivElement | undefined = $state()
  let timeout: ReturnType<typeof setTimeout> | null = null

  function getTransform(pos: string) {
    switch (pos) {
      case 'top': return 'translateX(-50%) translateY(-100%)'
      case 'bottom': return 'translateX(-50%)'
      case 'left': return 'translateY(-50%) translateX(-100%)'
      case 'right': return 'translateY(-50%)'
      default: return ''
    }
  }

  function calculatePosition() {
    if (!triggerEl) return
    const rect = triggerEl.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX
    const pad = 8

    switch (position) {
      case 'top':
        coords = { top: rect.top + scrollY - pad, left: rect.left + scrollX + rect.width / 2 }
        break
      case 'bottom':
        coords = { top: rect.bottom + scrollY + pad, left: rect.left + scrollX + rect.width / 2 }
        break
      case 'left':
        coords = { top: rect.top + scrollY + rect.height / 2, left: rect.left + scrollX - pad }
        break
      case 'right':
        coords = { top: rect.top + scrollY + rect.height / 2, left: rect.right + scrollX + pad }
        break
    }
  }

  function show() {
    timeout = setTimeout(() => {
      calculatePosition()
      visible = true
    }, delay)
  }

  function hide() {
    if (timeout) clearTimeout(timeout)
    visible = false
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={triggerEl}
  onmouseenter={show}
  onmouseleave={hide}
  class="inline-block"
>
  {@render children()}
</div>

{#if visible}
  <div
    transition:fade={{ duration: 100 }}
    style="position: absolute; top: {coords.top}px; left: {coords.left}px; transform: {getTransform(position)}; z-index: 9999;"
    class="bg-hud-bg-panel border border-hud-line px-3 py-2 text-xs text-hud-text max-w-xs pointer-events-none"
  >
    {@render content()}
  </div>
{/if}
