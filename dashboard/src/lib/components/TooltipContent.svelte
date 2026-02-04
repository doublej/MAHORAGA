<script lang="ts">
  let {
    title,
    items,
    description,
  }: {
    title?: string
    items?: Array<{ label: string; value: string | number; color?: string }>
    description?: string
  } = $props()
</script>

<div class="space-y-2">
  {#if title}
    <div class="hud-label text-hud-primary border-b border-hud-line/50 pb-1">{title}</div>
  {/if}

  {#if items && items.length > 0}
    <div class="space-y-1">
      {#each items as item}
        <div class="flex justify-between gap-4">
          <span class="text-hud-text-dim">{item.label}</span>
          <span class={item.color || 'text-hud-text-bright'}>{item.value}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if description}
    <p class="text-hud-text-dim text-[10px] leading-tight">{description}</p>
  {/if}
</div>
