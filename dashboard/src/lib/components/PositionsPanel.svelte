<script lang="ts">
  import Panel from './Panel.svelte'
  import Tooltip from './Tooltip.svelte'
  import TooltipContent from './TooltipContent.svelte'
  import Sparkline from './Sparkline.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'
  import { formatCurrency, formatPercent, isCryptoSymbol } from '$lib/utils'
  import { fade } from 'svelte/transition'
</script>

<Panel title="POSITIONS" titleRight="{dashboard.positions.length}/{dashboard.config?.max_positions || 5}" class="h-full">
  {#if dashboard.positions.length === 0}
    <div class="text-hud-text-dim text-sm py-8 text-center">No open positions</div>
  {:else}
    <div class="overflow-x-auto -mx-2 px-2">
      <table class="w-full">
        <thead>
          <tr class="border-b border-hud-line/50">
            <th class="hud-label text-left py-2 px-2">Symbol</th>
            <th class="hud-label text-right py-2 px-2">Qty</th>
            <th class="hud-label text-right py-2 px-2 hidden md:table-cell">Value</th>
            <th class="hud-label text-right py-2 px-2">P&L</th>
            <th class="hud-label text-center py-2 px-2 hidden sm:table-cell">Trend</th>
          </tr>
        </thead>
        <tbody>
          {#each dashboard.positions as pos (pos.symbol)}
            {@const plPct = (pos.unrealized_pl / (pos.market_value - pos.unrealized_pl)) * 100}
            {@const priceHistory = dashboard.positionPriceHistories[pos.symbol] || []}
            {@const posEntry = dashboard.status?.positionEntries?.[pos.symbol]}
            {@const staleness = dashboard.status?.stalenessAnalysis?.[pos.symbol]}
            {@const holdTime = posEntry ? Math.floor((Date.now() - posEntry.entry_time) / 3600000) : null}
            <tr
              class="border-b border-hud-line/20 hover:bg-hud-line/10"
              transition:fade={{ duration: 200 }}
            >
              <td class="hud-value-sm py-2 px-2">
                <Tooltip position="right">
                  {#snippet children()}
                    <span class="cursor-help border-b border-dotted border-hud-text-dim">
                      {#if isCryptoSymbol(pos.symbol, dashboard.config?.crypto_symbols)}
                        <span class="text-hud-warning mr-1">₿</span>
                      {/if}
                      {pos.symbol}
                    </span>
                  {/snippet}
                  {#snippet content()}
                    <TooltipContent
                      title={pos.symbol}
                      items={[
                        { label: 'Entry Price', value: posEntry ? formatCurrency(posEntry.entry_price) : 'N/A' },
                        { label: 'Current Price', value: formatCurrency(pos.current_price) },
                        { label: 'Hold Time', value: holdTime !== null ? `${holdTime}h` : 'N/A' },
                        { label: 'Entry Sentiment', value: posEntry ? `${(posEntry.entry_sentiment * 100).toFixed(0)}%` : 'N/A' },
                        ...(staleness ? [{ label: 'Staleness', value: `${(staleness.score * 100).toFixed(0)}%`, color: staleness.shouldExit ? 'text-hud-error' : 'text-hud-text' }] : []),
                      ]}
                      description={posEntry?.entry_reason}
                    />
                  {/snippet}
                </Tooltip>
              </td>
              <td class="hud-value-sm hud-nums text-right py-2 px-2">{pos.qty}</td>
              <td class="hud-value-sm hud-nums text-right py-2 px-2 hidden md:table-cell">{formatCurrency(pos.market_value)}</td>
              <td class="hud-value-sm hud-nums text-right py-2 px-2 {pos.unrealized_pl >= 0 ? 'text-hud-success' : 'text-hud-error'}">
                <div class="hud-nums">{formatCurrency(pos.unrealized_pl)}</div>
                <div class="text-xs opacity-70 hud-nums">{formatPercent(plPct)}</div>
              </td>
              <td class="py-2 px-2 hidden sm:table-cell">
                <div class="flex justify-center">
                  <Sparkline data={priceHistory} width={60} height={20} />
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</Panel>
