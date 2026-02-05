<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    title,
    titleRight,
    class: className = '',
    noPadding = false,
  }: {
    children: Snippet
    title?: string
    titleRight?: string | Snippet
    class?: string
    noPadding?: boolean
  } = $props()
</script>

<div class="hud-panel flex flex-col {className}">
  {#if title || titleRight}
    <div class="flex justify-between items-center px-3 sm:px-4 py-2 border-b border-hud-line shrink-0 gap-2">
      {#if title}
        <span class="hud-label truncate">{title}</span>
      {/if}
      {#if titleRight}
        {#if typeof titleRight === 'string'}
          <span class="hud-value-sm shrink-0">{titleRight}</span>
        {:else}
          {@render titleRight()}
        {/if}
      {/if}
    </div>
  {/if}
  <div class="flex-1 min-h-0 {noPadding ? '' : 'p-2.5 sm:p-3'}">
    {@render children()}
  </div>
</div>
