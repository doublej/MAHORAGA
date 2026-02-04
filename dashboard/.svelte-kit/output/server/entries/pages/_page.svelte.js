import "clsx";
import { d as dashboard, S as StatusIndicator, P as Panel } from "../../chunks/Panel.js";
import { l as escape_html } from "../../chunks/context.js";
import { w as attr_class, x as ensure_array_like, y as stringify, z as clsx, F as attr, G as attr_style } from "../../chunks/index.js";
function StatusBar($$renderer, $$props) {
  const statusColors = {
    active: "bg-hud-success",
    warning: "bg-hud-warning",
    error: "bg-hud-error",
    inactive: "bg-hud-dim"
  };
  let { items, class: className = "" } = $$props;
  $$renderer.push(`<div${attr_class(`flex items-center gap-6 ${stringify(className)}`)}><!--[-->`);
  const each_array = ensure_array_like(items);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let item = each_array[$$index];
    $$renderer.push(`<div class="flex items-center gap-2">`);
    if (item.status) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div${attr_class(`w-2 h-2 rounded-full ${stringify(statusColors[item.status])}`)}></div>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--> <span class="hud-label">${escape_html(item.label)}</span> <span class="hud-value-sm">${escape_html(item.value)}</span></div>`);
  }
  $$renderer.push(`<!--]--></div>`);
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
function formatPercent(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
function getAgentColor(agent) {
  const colors = {
    Analyst: "text-hud-purple",
    Executor: "text-hud-cyan",
    StockTwits: "text-hud-success",
    SignalResearch: "text-hud-cyan",
    PositionResearch: "text-hud-purple",
    Crypto: "text-hud-warning",
    System: "text-hud-text-dim"
  };
  return colors[agent] || "text-hud-text";
}
function isCryptoSymbol(symbol, cryptoSymbols = []) {
  return cryptoSymbols.includes(symbol) || symbol.includes("/USD") || symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL");
}
function getVerdictColor(verdict) {
  if (verdict === "BUY") return "text-hud-success";
  if (verdict === "SKIP") return "text-hud-error";
  return "text-hud-warning";
}
function getQualityColor(quality) {
  if (quality === "excellent") return "text-hud-success";
  if (quality === "good") return "text-hud-primary";
  if (quality === "fair") return "text-hud-warning";
  return "text-hud-error";
}
function getSentimentColor(score) {
  if (score >= 0.3) return "text-hud-success";
  if (score <= -0.2) return "text-hud-error";
  return "text-hud-warning";
}
function NotificationBell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { overnightActivity, premarketPlan } = $$props;
    let hasActivity = overnightActivity && (overnightActivity.signalsGathered > 0 || overnightActivity.signalsResearched > 0 || overnightActivity.buySignals > 0);
    let unreadCount = hasActivity && true ? (overnightActivity?.buySignals || 0) + (premarketPlan?.highConvictionPlays?.length || 0) : 0;
    [
      {
        label: "SIGNALS FOUND",
        value: overnightActivity?.signalsGathered || 0,
        highlight: false
      },
      {
        label: "RESEARCHED",
        value: overnightActivity?.signalsResearched || 0,
        highlight: false
      },
      {
        label: "BUY SIGNALS",
        value: overnightActivity?.buySignals || 0,
        highlight: !!overnightActivity?.buySignals && overnightActivity.buySignals > 0
      },
      {
        label: "TWITTER CONF",
        value: overnightActivity?.twitterConfirmations || 0,
        highlight: false
      }
    ];
    $$renderer2.push(`<div class="relative"><button${attr_class(`relative p-2 transition-colors ${stringify("text-hud-text-dim hover:text-hud-text")}`)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"${attr_class(clsx(unreadCount > 0 ? "animate-pulse" : ""))}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> `);
    if (unreadCount > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-hud-error text-[9px] font-bold rounded-full flex items-center justify-center text-white">${escape_html(unreadCount > 9 ? "9+" : unreadCount)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Header($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let timeStr = dashboard.time.toLocaleTimeString("en-US", { hour12: false });
    $$renderer2.push(`<header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-hud-line"><div class="flex items-center gap-4 md:gap-6"><div class="flex items-baseline gap-2"><span class="text-xl md:text-2xl font-light tracking-tight text-hud-text-bright">MAHORAGA</span> <span class="hud-label">v2</span></div> `);
    StatusIndicator($$renderer2, {
      status: dashboard.isMarketOpen ? "active" : "inactive",
      label: dashboard.isMarketOpen ? "MARKET OPEN" : "MARKET CLOSED",
      pulse: dashboard.isMarketOpen
    });
    $$renderer2.push(`<!----></div> <div class="flex items-center gap-3 md:gap-6 flex-wrap">`);
    StatusBar($$renderer2, {
      items: [
        {
          label: "LLM COST",
          value: `$${dashboard.costs.total_usd.toFixed(4)}`,
          status: dashboard.costs.total_usd > 1 ? "warning" : "active"
        },
        { label: "API CALLS", value: dashboard.costs.calls.toString() }
      ]
    });
    $$renderer2.push(`<!----> `);
    NotificationBell($$renderer2, {
      overnightActivity: dashboard.status?.overnightActivity,
      premarketPlan: dashboard.status?.premarketPlan
    });
    $$renderer2.push(`<!----> <a href="/settings" class="hud-label hover:text-hud-primary transition-colors">[CONFIG]</a> <span class="hud-value-sm font-mono">${escape_html(timeStr)}</span></div></header>`);
  });
}
function Metric($$renderer, $$props) {
  const sizeClasses = {
    sm: "hud-value-sm",
    md: "hud-value-md",
    lg: "hud-value-lg",
    xl: "hud-value-xl"
  };
  const colorClasses = {
    default: "",
    success: "text-hud-success",
    warning: "text-hud-warning",
    error: "text-hud-error"
  };
  let {
    label,
    value,
    size = "lg",
    color = "default",
    class: className = ""
  } = $$props;
  $$renderer.push(`<div${attr_class(`flex flex-col ${stringify(className)}`)}><span class="hud-label mb-1">${escape_html(label)}</span> <span${attr_class(`${stringify(sizeClasses[size])} ${stringify(colorClasses[color])}`)}>${escape_html(value)}</span></div>`);
}
function MetricInline($$renderer, $$props) {
  const colorClasses = {
    default: "",
    success: "text-hud-success",
    warning: "text-hud-warning",
    error: "text-hud-error"
  };
  let {
    label,
    value,
    color = "default",
    valueClassName = "",
    class: className = ""
  } = $$props;
  $$renderer.push(`<div${attr_class(`flex items-baseline gap-2 ${stringify(className)}`)}><span class="hud-label">${escape_html(label)}</span> <span${attr_class(`hud-value-sm ${stringify(valueClassName || colorClasses[color])}`)}>${escape_html(value)}</span></div>`);
}
function AccountPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Panel($$renderer2, {
      title: "ACCOUNT",
      class: "h-full",
      children: ($$renderer3) => {
        if (dashboard.account) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="space-y-4">`);
          Metric($$renderer3, {
            label: "EQUITY",
            value: formatCurrency(dashboard.account.equity),
            size: "xl"
          });
          $$renderer3.push(`<!----> <div class="grid grid-cols-2 gap-4">`);
          Metric($$renderer3, {
            label: "CASH",
            value: formatCurrency(dashboard.account.cash),
            size: "md"
          });
          $$renderer3.push(`<!----> `);
          Metric($$renderer3, {
            label: "BUYING POWER",
            value: formatCurrency(dashboard.account.buying_power),
            size: "md"
          });
          $$renderer3.push(`<!----></div> <div class="pt-2 border-t border-hud-line space-y-2">`);
          Metric($$renderer3, {
            label: "TOTAL P&L",
            value: `${stringify(formatCurrency(dashboard.totalPl))} (${stringify(formatPercent(dashboard.totalPlPct))})`,
            size: "md",
            color: dashboard.totalPl >= 0 ? "success" : "error"
          });
          $$renderer3.push(`<!----> <div class="grid grid-cols-2 gap-2">`);
          MetricInline($$renderer3, {
            label: "REALIZED",
            value: formatCurrency(dashboard.realizedPl),
            color: dashboard.realizedPl >= 0 ? "success" : "error"
          });
          $$renderer3.push(`<!----> `);
          MetricInline($$renderer3, {
            label: "UNREALIZED",
            value: formatCurrency(dashboard.unrealizedPl),
            color: dashboard.unrealizedPl >= 0 ? "success" : "error"
          });
          $$renderer3.push(`<!----></div></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<div class="text-hud-text-dim text-sm">Loading...</div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function Tooltip($$renderer, $$props) {
  let { children, content, position = "top", delay = 200 } = $$props;
  $$renderer.push(`<div class="inline-block">`);
  children($$renderer);
  $$renderer.push(`<!----></div> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
function TooltipContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { title, items, description } = $$props;
    $$renderer2.push(`<div class="space-y-2">`);
    if (title) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="hud-label text-hud-primary border-b border-hud-line/50 pb-1">${escape_html(title)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (items && items.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-1"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<div class="flex justify-between gap-4"><span class="text-hud-text-dim">${escape_html(item.label)}</span> <span${attr_class(clsx(item.color || "text-hud-text-bright"))}>${escape_html(item.value)}</span></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (description) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-hud-text-dim text-[10px] leading-tight">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function Sparkline($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const variantColors = {
      green: { stroke: "var(--color-hud-green)" },
      red: { stroke: "var(--color-hud-red)" }
    };
    let { data, width = 80, height = 24 } = $$props;
    let pad = 2;
    let chartWidth = width - pad * 2;
    let chartHeight = height - pad * 2;
    let minValue = Math.min(...data);
    let maxValue = Math.max(...data);
    let valueRange = maxValue - minValue || 1;
    let pathD = (() => {
      if (data.length < 2) return "";
      return data.map((value, i) => {
        const x = pad + i / (data.length - 1) * chartWidth;
        const y = pad + chartHeight - (value - minValue) / valueRange * chartHeight;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ");
    })();
    let isPositive = data.length >= 2 && data[data.length - 1] >= data[0];
    let strokeColor = isPositive ? variantColors.green.stroke : variantColors.red.stroke;
    if (data.length >= 2) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg${attr("width", width)}${attr("height", height)}><path${attr("d", pathD)} fill="none"${attr("stroke", strokeColor)} stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function PositionsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Panel($$renderer2, {
      title: "POSITIONS",
      titleRight: `${stringify(dashboard.positions.length)}/${stringify(dashboard.config?.max_positions || 5)}`,
      class: "h-full",
      children: ($$renderer3) => {
        if (dashboard.positions.length === 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="text-hud-text-dim text-sm py-8 text-center">No open positions</div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-hud-line/50"><th class="hud-label text-left py-2 px-2">Symbol</th><th class="hud-label text-right py-2 px-2 hidden sm:table-cell">Qty</th><th class="hud-label text-right py-2 px-2 hidden md:table-cell">Value</th><th class="hud-label text-right py-2 px-2">P&amp;L</th><th class="hud-label text-center py-2 px-2">Trend</th></tr></thead><tbody><!--[-->`);
          const each_array = ensure_array_like(dashboard.positions);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let pos = each_array[$$index];
            const plPct = pos.unrealized_pl / (pos.market_value - pos.unrealized_pl) * 100;
            const priceHistory = dashboard.positionPriceHistories[pos.symbol] || [];
            const posEntry = dashboard.status?.positionEntries?.[pos.symbol];
            const staleness = dashboard.status?.stalenessAnalysis?.[pos.symbol];
            const holdTime = posEntry ? Math.floor((Date.now() - posEntry.entry_time) / 36e5) : null;
            $$renderer3.push(`<tr class="border-b border-hud-line/20 hover:bg-hud-line/10"><td class="hud-value-sm py-2 px-2">`);
            {
              let children = function($$renderer4) {
                $$renderer4.push(`<span class="cursor-help border-b border-dotted border-hud-text-dim">`);
                if (isCryptoSymbol(pos.symbol, dashboard.config?.crypto_symbols)) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<span class="text-hud-warning mr-1">₿</span>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--> ${escape_html(pos.symbol)}</span>`);
              }, content = function($$renderer4) {
                TooltipContent($$renderer4, {
                  title: pos.symbol,
                  items: [
                    {
                      label: "Entry Price",
                      value: posEntry ? formatCurrency(posEntry.entry_price) : "N/A"
                    },
                    {
                      label: "Current Price",
                      value: formatCurrency(pos.current_price)
                    },
                    {
                      label: "Hold Time",
                      value: holdTime !== null ? `${holdTime}h` : "N/A"
                    },
                    {
                      label: "Entry Sentiment",
                      value: posEntry ? `${(posEntry.entry_sentiment * 100).toFixed(0)}%` : "N/A"
                    },
                    ...staleness ? [
                      {
                        label: "Staleness",
                        value: `${(staleness.score * 100).toFixed(0)}%`,
                        color: staleness.shouldExit ? "text-hud-error" : "text-hud-text"
                      }
                    ] : []
                  ],
                  description: posEntry?.entry_reason
                });
              };
              Tooltip($$renderer3, {
                position: "right",
                children,
                content
              });
            }
            $$renderer3.push(`<!----></td><td class="hud-value-sm text-right py-2 px-2 hidden sm:table-cell">${escape_html(pos.qty)}</td><td class="hud-value-sm text-right py-2 px-2 hidden md:table-cell">${escape_html(formatCurrency(pos.market_value))}</td><td${attr_class(`hud-value-sm text-right py-2 px-2 ${stringify(pos.unrealized_pl >= 0 ? "text-hud-success" : "text-hud-error")}`)}><div>${escape_html(formatCurrency(pos.unrealized_pl))}</div> <div class="text-xs opacity-70">${escape_html(formatPercent(plPct))}</div></td><td class="py-2 px-2"><div class="flex justify-center">`);
            Sparkline($$renderer3, { data: priceHistory, width: 60, height: 20 });
            $$renderer3.push(`<!----></div></td></tr>`);
          }
          $$renderer3.push(`<!--]--></tbody></table></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function CostsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Panel($$renderer2, {
      title: "LLM COSTS",
      class: "h-full",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="grid grid-cols-2 gap-4">`);
        Metric($$renderer3, {
          label: "TOTAL SPENT",
          value: `$${stringify(dashboard.costs.total_usd.toFixed(4))}`,
          size: "lg"
        });
        $$renderer3.push(`<!----> `);
        Metric($$renderer3, {
          label: "API CALLS",
          value: dashboard.costs.calls.toString(),
          size: "lg"
        });
        $$renderer3.push(`<!----> `);
        MetricInline($$renderer3, {
          label: "TOKENS IN",
          value: dashboard.costs.tokens_in.toLocaleString()
        });
        $$renderer3.push(`<!----> `);
        MetricInline($$renderer3, {
          label: "TOKENS OUT",
          value: dashboard.costs.tokens_out.toLocaleString()
        });
        $$renderer3.push(`<!----> `);
        MetricInline($$renderer3, {
          label: "AVG COST/CALL",
          value: dashboard.costs.calls > 0 ? `$${(dashboard.costs.total_usd / dashboard.costs.calls).toFixed(6)}` : "$0"
        });
        $$renderer3.push(`<!----> `);
        MetricInline($$renderer3, {
          label: "MODEL",
          value: dashboard.config?.llm_model || "gpt-4o-mini"
        });
        $$renderer3.push(`<!----></div>`);
      }
    });
  });
}
function LineChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const variantColors = {
      cyan: {
        stroke: "var(--color-hud-cyan)",
        fill: "var(--color-hud-cyan)"
      },
      blue: {
        stroke: "var(--color-hud-blue)",
        fill: "var(--color-hud-blue)"
      },
      green: {
        stroke: "var(--color-hud-green)",
        fill: "var(--color-hud-green)"
      },
      yellow: {
        stroke: "var(--color-hud-yellow)",
        fill: "var(--color-hud-yellow)"
      },
      red: { stroke: "var(--color-hud-red)", fill: "var(--color-hud-red)" },
      purple: {
        stroke: "var(--color-hud-purple)",
        fill: "var(--color-hud-purple)"
      },
      primary: {
        stroke: "var(--color-hud-primary)",
        fill: "var(--color-hud-primary)"
      }
    };
    let {
      series,
      labels,
      variant = "cyan",
      height,
      showDots = false,
      showGrid = true,
      showArea = true,
      animated = true,
      formatValue
    } = $$props;
    const viewBoxWidth = 800;
    let viewBoxHeight = height || 200;
    const padding = { top: 16, right: 16, bottom: 28, left: 56 };
    let chartWidth = viewBoxWidth - padding.left - padding.right;
    let chartHeight = viewBoxHeight - padding.top - padding.bottom;
    let allValues = series.flatMap((s) => s.data);
    let dataMin = Math.min(...allValues);
    let dataMax = Math.max(...allValues);
    let range = dataMax - dataMin || 1;
    let minValue = dataMin - range * 0.05;
    let maxValue = dataMax + range * 0.05;
    let valueRange = maxValue - minValue || 1;
    let maxPoints = Math.max(...series.map((s) => s.data.length), 1);
    function getX(index) {
      return padding.left + index / (maxPoints - 1 || 1) * chartWidth;
    }
    function getY(value) {
      return padding.top + chartHeight - (value - minValue) / valueRange * chartHeight;
    }
    let gridValues = Array.from({ length: 4 }, (_, i) => minValue + valueRange / 3 * i);
    let formatLabel = formatValue || ((v) => {
      if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
      return v.toFixed(0);
    });
    let labelIndices = (() => {
      if (!labels) return [];
      const step = Math.ceil(labels.length / 5);
      return labels.map((_, i) => i).filter((i) => i % step === 0);
    })();
    $$renderer2.push(`<svg width="100%" height="100%"${attr("viewBox", `0 0 ${stringify(viewBoxWidth)} ${stringify(viewBoxHeight)}`)} preserveAspectRatio="xMidYMid meet" class="block">`);
    if (showGrid) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<g><!--[-->`);
      const each_array = ensure_array_like(gridValues);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let value = each_array[$$index];
        $$renderer2.push(`<line${attr("x1", padding.left)}${attr("y1", getY(value))}${attr("x2", viewBoxWidth - padding.right)}${attr("y2", getY(value))} stroke="currentColor" class="text-hud-border" stroke-width="0.5" opacity="0.3"></line><text${attr("x", padding.left - 8)}${attr("y", getY(value))} text-anchor="end" dominant-baseline="middle" fill="currentColor" class="text-hud-text-dim" font-size="12">${escape_html(formatLabel(value))}</text>`);
      }
      $$renderer2.push(`<!--]--></g>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if (labels) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<g><!--[-->`);
      const each_array_1 = ensure_array_like(labelIndices);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let idx = each_array_1[$$index_1];
        $$renderer2.push(`<text${attr("x", getX(idx))}${attr("y", viewBoxHeight - 8)} text-anchor="middle" fill="currentColor" class="text-hud-text-dim" font-size="12">${escape_html(labels[idx])}</text>`);
      }
      $$renderer2.push(`<!--]--></g>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_2 = ensure_array_like(series);
    for (let seriesIndex = 0, $$length = each_array_2.length; seriesIndex < $$length; seriesIndex++) {
      let s = each_array_2[seriesIndex];
      const colors = variantColors[s.variant ?? variant];
      const points = s.data.map((value, i) => ({ x: getX(i), y: getY(value) }));
      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartHeight} L ${points[0]?.x ?? 0} ${padding.top + chartHeight} Z`;
      if (points.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<g>`);
        if (showArea) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<defs><linearGradient${attr("id", `area-gradient-${stringify(seriesIndex)}`)} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%"${attr("stop-color", colors.fill)} stop-opacity="0.2"></stop><stop offset="100%"${attr("stop-color", colors.fill)} stop-opacity="0"></stop></linearGradient></defs><path${attr("d", areaD)}${attr("fill", `url(#area-gradient-${stringify(seriesIndex)})`)}></path>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--><path${attr("d", pathD)} fill="none"${attr("stroke", colors.stroke)} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"></path>`);
        if (showDots) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<!--[-->`);
          const each_array_3 = ensure_array_like(points);
          for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
            let p = each_array_3[$$index_2];
            $$renderer2.push(`<circle${attr("cx", p.x)}${attr("cy", p.y)} r="2"${attr("fill", colors.fill)} opacity="0.8"></circle>`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></g>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function PortfolioChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Panel($$renderer2, {
      title: "PORTFOLIO PERFORMANCE",
      titleRight: "24H",
      class: "h-[320px]",
      children: ($$renderer3) => {
        if (dashboard.portfolioChartData.length > 1) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="h-full w-full">`);
          LineChart($$renderer3, {
            series: [
              {
                label: "Equity",
                data: dashboard.portfolioChartData,
                variant: dashboard.totalPl >= 0 ? "green" : "red"
              }
            ],
            labels: dashboard.portfolioChartLabels,
            showArea: true,
            showGrid: true,
            showDots: false,
            formatValue: (v) => `$${(v / 1e3).toFixed(1)}k`
          });
          $$renderer3.push(`<!----></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<div class="h-full flex items-center justify-center text-hud-text-dim text-sm">Collecting performance data...</div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function PositionPerformance($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const positionColors = ["cyan", "purple", "yellow", "blue", "green"];
    Panel($$renderer2, {
      title: "POSITION PERFORMANCE",
      titleRight: "% CHANGE",
      class: "h-[320px]",
      children: ($$renderer3) => {
        if (dashboard.positions.length === 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="h-full flex items-center justify-center text-hud-text-dim text-sm">No positions to display</div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          if (dashboard.normalizedPositionSeries.length > 0) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<div class="h-full flex flex-col"><div class="flex flex-wrap gap-3 mb-2 pb-2 border-b border-hud-line/30 shrink-0"><!--[-->`);
            const each_array = ensure_array_like(dashboard.positions.slice(0, 5));
            for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
              let pos = each_array[idx];
              const isPositive = pos.unrealized_pl >= 0;
              const plPct = pos.unrealized_pl / (pos.market_value - pos.unrealized_pl) * 100;
              const color = positionColors[idx % positionColors.length];
              $$renderer3.push(`<div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full"${attr_style(`background-color: var(--color-hud-${stringify(color)})`)}></div> <span class="hud-value-sm">${escape_html(pos.symbol)}</span> <span${attr_class(`hud-label ${stringify(isPositive ? "text-hud-success" : "text-hud-error")}`)}>${escape_html(formatPercent(plPct))}</span></div>`);
            }
            $$renderer3.push(`<!--]--></div> <div class="flex-1 min-h-0 w-full">`);
            LineChart($$renderer3, {
              series: dashboard.normalizedPositionSeries.slice(0, 5),
              showArea: false,
              showGrid: true,
              showDots: false,
              animated: false,
              formatValue: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`
            });
            $$renderer3.push(`<!----></div></div>`);
          } else {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push(`<div class="h-full flex items-center justify-center text-hud-text-dim text-sm">Loading position data...</div>`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function SignalsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Panel($$renderer2, {
      title: "ACTIVE SIGNALS",
      titleRight: dashboard.signals.length.toString(),
      class: "h-80",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="overflow-y-auto h-full space-y-1">`);
        if (dashboard.signals.length === 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="text-hud-text-dim text-sm py-4 text-center">Gathering signals...</div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(dashboard.signals.slice(0, 20));
          for (let i = 0, $$length = each_array.length; i < $$length; i++) {
            let sig = each_array[i];
            {
              let children = function($$renderer4) {
                $$renderer4.push(`<div${attr_class(`flex items-center justify-between py-1 px-2 border-b border-hud-line/10 hover:bg-hud-line/10 cursor-help ${stringify(sig.isCrypto ? "bg-hud-warning/5" : "")}`)}><div class="flex items-center gap-2">`);
                if (sig.isCrypto) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<span class="text-hud-warning text-xs">₿</span>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--> <span class="hud-value-sm">${escape_html(sig.symbol)}</span> <span${attr_class(`hud-label ${stringify(sig.isCrypto ? "text-hud-warning" : "")}`)}>${escape_html(sig.source?.toUpperCase() || "N/A")}</span></div> <div class="flex items-center gap-3">`);
                if (sig.isCrypto && sig.momentum !== void 0) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<span${attr_class(`hud-label hidden sm:inline ${stringify(sig.momentum >= 0 ? "text-hud-success" : "text-hud-error")}`)}>${escape_html(sig.momentum >= 0 ? "+" : "")}${escape_html(sig.momentum.toFixed(1))}%</span>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                  $$renderer4.push(`<span class="hud-label hidden sm:inline">VOL ${escape_html(sig.volume)}</span>`);
                }
                $$renderer4.push(`<!--]--> <span${attr_class(`hud-value-sm ${stringify(getSentimentColor(sig.sentiment))}`)}>${escape_html((sig.sentiment * 100).toFixed(0))}%</span></div></div>`);
              }, content = function($$renderer4) {
                TooltipContent($$renderer4, {
                  title: `${stringify(sig.symbol)} - ${stringify(sig.source?.toUpperCase() || "N/A")}`,
                  items: [
                    {
                      label: "Sentiment",
                      value: `${(sig.sentiment * 100).toFixed(0)}%`,
                      color: getSentimentColor(sig.sentiment)
                    },
                    { label: "Volume", value: sig.volume },
                    ...sig.bullish !== void 0 ? [
                      {
                        label: "Bullish",
                        value: sig.bullish,
                        color: "text-hud-success"
                      }
                    ] : [],
                    ...sig.bearish !== void 0 ? [
                      {
                        label: "Bearish",
                        value: sig.bearish,
                        color: "text-hud-error"
                      }
                    ] : [],
                    ...sig.score !== void 0 ? [{ label: "Score", value: sig.score }] : [],
                    ...sig.upvotes !== void 0 ? [{ label: "Upvotes", value: sig.upvotes }] : [],
                    ...sig.momentum !== void 0 ? [
                      {
                        label: "Momentum",
                        value: `${sig.momentum >= 0 ? "+" : ""}${sig.momentum.toFixed(2)}%`
                      }
                    ] : [],
                    ...sig.price !== void 0 ? [{ label: "Price", value: formatCurrency(sig.price) }] : []
                  ],
                  description: sig.reason
                });
              };
              Tooltip($$renderer3, {
                position: "right",
                children,
                content
              });
            }
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
  });
}
function LogDetailsTooltip($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { log } = $$props;
    const details = () => {
      const { timestamp, agent, action, symbol, ...rest } = log;
      return rest;
    };
    function formatValue(key, value) {
      if (value === null || value === void 0) return "N/A";
      if (typeof value === "boolean") return value ? "✓" : "✗";
      if (typeof value === "number") {
        if (key.includes("pct") || key.includes("confidence")) {
          return `${(value * 100).toFixed(1)}%`;
        }
        return value.toLocaleString();
      }
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object") return JSON.stringify(value, null, 2);
      return String(value);
    }
    const research = log.symbol && dashboard.status?.signalResearch?.[log.symbol];
    const positionEntry = log.symbol && dashboard.status?.positionEntries?.[log.symbol];
    $$renderer2.push(`<div class="space-y-2 max-w-md"><div class="font-bold text-hud-primary">${escape_html(log.agent?.toUpperCase() || "N/A")} - ${escape_html(log.action?.toUpperCase() || "N/A")}</div> <div class="border-t border-hud-line pt-2 space-y-1"><!--[-->`);
    const each_array = ensure_array_like(Object.entries(details()));
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [key, value] = each_array[$$index];
      $$renderer2.push(`<div class="flex justify-between gap-4"><span class="text-hud-text-dim">${escape_html(key)}:</span> <span class="text-hud-text text-right font-mono">${escape_html(formatValue(key, value))}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (research) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-t border-hud-line pt-2"><div class="text-hud-warning text-xs">RESEARCH CONTEXT</div> <div class="text-xs space-y-1 mt-1"><div>Verdict: ${escape_html(research.verdict)} (${escape_html((research.confidence * 100).toFixed(0))}%)</div> `);
      if (research.reasoning) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="text-hud-text-dim">${escape_html(research.reasoning)}</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (positionEntry) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="border-t border-hud-line pt-2"><div class="text-hud-success text-xs">POSITION ENTRY</div> <div class="text-xs space-y-1 mt-1"><div>Entry: $${escape_html(positionEntry.entry_price)}</div> <div>Time: ${escape_html(new Date(positionEntry.entry_time).toLocaleString())}</div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function ActivityFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function hasDetails(log) {
      const { timestamp, agent, action, symbol, ...details } = log;
      return Object.keys(details).length > 0;
    }
    $$renderer2.push(`<div class="hud-panel flex flex-col h-80"><div class="flex justify-between items-center px-4 py-2 border-b border-hud-line shrink-0"><span class="hud-label">ACTIVITY FEED</span> <div class="flex items-center gap-3"><span class="hud-label">LIVE</span> <button class="text-[10px] text-hud-primary hover:text-hud-text-bright transition-colors uppercase tracking-wider cursor-pointer">View All</button></div></div> <div class="flex-1 min-h-0 p-3"><div class="overflow-y-auto h-full font-mono text-xs space-y-1">`);
    if (dashboard.logs.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-hud-text-dim py-4 text-center">Waiting for activity...</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(dashboard.logs.slice(-200));
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let log = each_array[i];
        {
          let children = function($$renderer3) {
            $$renderer3.push(`<div class="flex items-start gap-2 py-1 border-b border-hud-line/10 hover:bg-hud-line/5 cursor-help"><span class="text-hud-text-dim shrink-0 hidden sm:inline w-[52px]">${escape_html(new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false }))}</span> <span${attr_class(`shrink-0 w-[72px] text-right ${stringify(getAgentColor(log.agent))}`)}>${escape_html(log.agent)}</span> <span class="text-hud-text flex-1 text-right wrap-break-word">${escape_html(log.action)} `);
            if (log.symbol) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="text-hud-primary ml-1">(${escape_html(log.symbol)})</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (hasDetails(log)) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<span class="text-hud-primary ml-1">•</span>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></span></div>`);
          }, content = function($$renderer3) {
            LogDetailsTooltip($$renderer3, { log });
          };
          Tooltip($$renderer2, {
            position: "right",
            children,
            content
          });
        }
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ResearchCardExpanded($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { research } = $$props;
    $$renderer2.push(`<div class="px-2 pb-2 space-y-3"><div class="research-section"><div class="hud-label text-hud-text-dim mb-1">REASONING</div> <p class="text-xs text-hud-text leading-relaxed">${escape_html(research.reasoning)}</p></div> <div class="research-section grid grid-cols-2 gap-2"><div><span class="hud-label text-hud-text-dim block mb-0.5">Confidence</span> <span class="hud-value-sm text-hud-text-bright">${escape_html((research.confidence * 100).toFixed(0))}%</span></div> <div><span class="hud-label text-hud-text-dim block mb-0.5">Sentiment</span> <span${attr_class(`hud-value-sm ${stringify(getSentimentColor(research.sentiment))}`)}>${escape_html((research.sentiment * 100).toFixed(0))}%</span></div> <div><span class="hud-label text-hud-text-dim block mb-0.5">Entry Quality</span> <span class="hud-value-sm text-hud-text">${escape_html(research.entry_quality?.toUpperCase() || "N/A")}</span></div> <div><span class="hud-label text-hud-text-dim block mb-0.5">Analyzed</span> <span class="hud-value-sm text-hud-text">${escape_html(new Date(research.timestamp).toLocaleTimeString("en-US", { hour12: false }))}</span></div></div> `);
    if (research.catalysts.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="research-section"><div class="hud-label text-hud-text-dim mb-2">CATALYSTS</div> <ul class="space-y-1.5"><!--[-->`);
      const each_array = ensure_array_like(research.catalysts);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let catalyst = each_array[$$index];
        $$renderer2.push(`<li class="flex items-start gap-2"><span class="text-hud-success shrink-0 mt-0.5">+</span> <span class="text-xs text-hud-success leading-relaxed">${escape_html(catalyst)}</span></li>`);
      }
      $$renderer2.push(`<!--]--></ul></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (research.red_flags.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="research-section"><div class="hud-label text-hud-text-dim mb-2">RED FLAGS</div> <ul class="space-y-1.5"><!--[-->`);
      const each_array_1 = ensure_array_like(research.red_flags);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let flag = each_array_1[$$index_1];
        $$renderer2.push(`<li class="flex items-start gap-2"><span class="text-hud-error shrink-0 mt-0.5">−</span> <span class="text-xs text-hud-error leading-relaxed">${escape_html(flag)}</span></li>`);
      }
      $$renderer2.push(`<!--]--></ul></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function ResearchPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let researchEntries = Object.entries(dashboard.status?.signalResearch || {});
    let expandedSymbol = null;
    Panel($$renderer2, {
      title: "SIGNAL RESEARCH",
      titleRight: researchEntries.length.toString(),
      class: "h-80",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="overflow-y-auto h-full space-y-2">`);
        if (researchEntries.length === 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="text-hud-text-dim text-sm py-4 text-center">Researching candidates...</div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(researchEntries);
          for (let $$index_3 = 0, $$length = each_array.length; $$index_3 < $$length; $$index_3++) {
            let [symbol, research] = each_array[$$index_3];
            const r = research;
            const isExpanded = expandedSymbol === symbol;
            $$renderer3.push(`<div${attr_class("border border-hud-line/30 rounded transition-all duration-200", void 0, {
              "research-card-expanded": isExpanded,
              "research-card-collapsed": !isExpanded
            })}>`);
            {
              let children = function($$renderer4) {
                $$renderer4.push(`<div class="p-2 cursor-pointer" role="button" tabindex="0"${attr("aria-expanded", isExpanded)}><div class="flex justify-between items-center mb-1"><div class="flex items-center gap-2"><span class="hud-value-sm">${escape_html(symbol)}</span> <span class="text-hud-text-dim text-xs">${escape_html(isExpanded ? "⌃" : "⌄")}</span></div> <div class="flex items-center gap-2"><span${attr_class(`hud-label ${stringify(getQualityColor(r.entry_quality))}`)}>${escape_html(r.entry_quality?.toUpperCase() || "N/A")}</span> <span${attr_class(`hud-value-sm font-bold ${stringify(getVerdictColor(r.verdict))}`)}>${escape_html(r.verdict)}</span></div></div> `);
                if (!isExpanded) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<p class="text-xs text-hud-text-dim leading-tight mb-1">${escape_html(r.reasoning)}</p> `);
                  if (r.red_flags.length > 0) {
                    $$renderer4.push("<!--[-->");
                    $$renderer4.push(`<div class="flex flex-wrap gap-1"><!--[-->`);
                    const each_array_1 = ensure_array_like(r.red_flags.slice(0, 2));
                    for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                      let flag = each_array_1[$$index];
                      $$renderer4.push(`<span class="text-xs text-hud-error bg-hud-error/10 px-1 rounded">${escape_html(flag.slice(0, 30))}...</span>`);
                    }
                    $$renderer4.push(`<!--]--></div>`);
                  } else {
                    $$renderer4.push("<!--[!-->");
                  }
                  $$renderer4.push(`<!--]-->`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--></div>`);
              }, content = function($$renderer4) {
                $$renderer4.push(`<div class="space-y-2 min-w-[200px]"><div class="hud-label text-hud-primary border-b border-hud-line/50 pb-1">${escape_html(symbol)} DETAILS</div> <div class="space-y-1"><div class="flex justify-between"><span class="text-hud-text-dim">Confidence</span> <span class="text-hud-text-bright">${escape_html((r.confidence * 100).toFixed(0))}%</span></div> <div class="flex justify-between"><span class="text-hud-text-dim">Sentiment</span> <span${attr_class(clsx(getSentimentColor(r.sentiment)))}>${escape_html((r.sentiment * 100).toFixed(0))}%</span></div> <div class="flex justify-between"><span class="text-hud-text-dim">Analyzed</span> <span class="text-hud-text">${escape_html(new Date(r.timestamp).toLocaleTimeString("en-US", { hour12: false }))}</span></div></div> `);
                if (r.catalysts.length > 0) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<div class="pt-1 border-t border-hud-line/30"><span class="text-[9px] text-hud-text-dim">CATALYSTS:</span> <ul class="mt-1 space-y-0.5"><!--[-->`);
                  const each_array_2 = ensure_array_like(r.catalysts);
                  for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                    let c = each_array_2[$$index_1];
                    $$renderer4.push(`<li class="text-[10px] text-hud-success">+ ${escape_html(c)}</li>`);
                  }
                  $$renderer4.push(`<!--]--></ul></div>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--> `);
                if (r.red_flags.length > 0) {
                  $$renderer4.push("<!--[-->");
                  $$renderer4.push(`<div class="pt-1 border-t border-hud-line/30"><span class="text-[9px] text-hud-text-dim">RED FLAGS:</span> <ul class="mt-1 space-y-0.5"><!--[-->`);
                  const each_array_3 = ensure_array_like(r.red_flags);
                  for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
                    let f = each_array_3[$$index_2];
                    $$renderer4.push(`<li class="text-[10px] text-hud-error">- ${escape_html(f)}</li>`);
                  }
                  $$renderer4.push(`<!--]--></ul></div>`);
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]--></div>`);
              };
              Tooltip($$renderer3, {
                position: "left",
                children,
                content
              });
            }
            $$renderer3.push(`<!----> `);
            if (isExpanded) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<div>`);
              ResearchCardExpanded($$renderer3, { research: r });
              $$renderer3.push(`<!----></div>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
  });
}
function DashboardFooter($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let config = dashboard.config;
    $$renderer2.push(`<footer class="mt-4 pt-3 border-t border-hud-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"><div class="flex flex-wrap gap-4 md:gap-6">`);
    if (config) {
      $$renderer2.push("<!--[-->");
      MetricInline($$renderer2, {
        label: "MAX POS",
        value: `$${stringify(config.max_position_value)}`
      });
      $$renderer2.push(`<!----> `);
      MetricInline($$renderer2, {
        label: "MIN SENT",
        value: `${stringify((config.min_sentiment_score * 100).toFixed(0))}%`
      });
      $$renderer2.push(`<!----> `);
      MetricInline($$renderer2, {
        label: "TAKE PROFIT",
        value: `${stringify(config.take_profit_pct)}%`
      });
      $$renderer2.push(`<!----> `);
      MetricInline($$renderer2, {
        label: "STOP LOSS",
        value: `${stringify(config.stop_loss_pct)}%`
      });
      $$renderer2.push(`<!----> <span class="hidden lg:inline text-hud-line">|</span> `);
      MetricInline($$renderer2, {
        label: "OPTIONS",
        value: config.options_enabled ? "ON" : "OFF",
        valueClassName: config.options_enabled ? "text-hud-purple" : "text-hud-text-dim"
      });
      $$renderer2.push(`<!----> `);
      if (config.options_enabled) {
        $$renderer2.push("<!--[-->");
        MetricInline($$renderer2, {
          label: "OPT Δ",
          value: config.options_target_delta?.toFixed(2) || "0.35"
        });
        $$renderer2.push(`<!----> `);
        MetricInline($$renderer2, {
          label: "OPT DTE",
          value: `${stringify(config.options_min_dte || 7)}-${stringify(config.options_max_dte || 45)}`
        });
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <span class="hidden lg:inline text-hud-line">|</span> `);
      MetricInline($$renderer2, {
        label: "CRYPTO",
        value: config.crypto_enabled ? "24/7" : "OFF",
        valueClassName: config.crypto_enabled ? "text-hud-warning" : "text-hud-text-dim"
      });
      $$renderer2.push(`<!----> `);
      if (config.crypto_enabled) {
        $$renderer2.push("<!--[-->");
        MetricInline($$renderer2, {
          label: "SYMBOLS",
          value: (config.crypto_symbols || ["BTC", "ETH", "SOL"]).map((s) => s.split("/")[0]).join("/")
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div class="flex items-center gap-4"><span class="hud-label hidden md:inline">AUTONOMOUS TRADING SYSTEM</span> <span class="hud-value-sm">PAPER MODE</span></div></footer>`);
  });
}
function ErrorScreen($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { error } = $$props;
    let isAuthError = error.includes("Unauthorized");
    let apiToken = localStorage.getItem("mahoraga_api_token") || "";
    $$renderer2.push(`<div class="min-h-screen bg-hud-bg flex items-center justify-center p-6">`);
    Panel($$renderer2, {
      title: isAuthError ? "AUTHENTICATION REQUIRED" : "CONNECTION ERROR",
      class: "max-w-md w-full",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="text-center py-8"><div class="text-hud-error text-2xl mb-4">${escape_html(isAuthError ? "NO TOKEN" : "OFFLINE")}</div> <p class="text-hud-text-dim text-sm mb-6">${escape_html(error)}</p> `);
        if (isAuthError) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="space-y-4"><div class="text-left bg-hud-panel p-4 border border-hud-line"><label class="hud-label block mb-2">API Token</label> <input type="password" class="hud-input w-full mb-2" placeholder="Enter MAHORAGA_API_TOKEN"${attr("value", apiToken)}/> <button class="hud-button w-full">Save &amp; Connect</button></div> <p class="text-hud-text-dim text-xs">Find your token in <code class="text-hud-primary">.dev.vars</code> (local) or Cloudflare secrets (deployed)</p></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<p class="text-hud-text-dim text-xs">Enable the agent: <code class="text-hud-primary">curl -H "Authorization: Bearer $TOKEN" localhost:8787/agent/enable</code></p>`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function SetupWizard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let disclaimerAccepted = false;
    $$renderer2.push(`<div class="min-h-screen bg-hud-bg flex items-center justify-center p-6">`);
    Panel($$renderer2, {
      title: "MAHORAGA SETUP",
      class: "w-full max-w-xl",
      children: ($$renderer3) => {
        {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="space-y-6"><div class="text-center py-2"><h2 class="text-xl font-light text-hud-warning mb-2">Risk Disclaimer</h2> <p class="text-hud-text-dim text-xs">Please read carefully before proceeding</p></div> <div class="bg-hud-bg p-4 rounded text-xs text-hud-text-dim space-y-3 max-h-64 overflow-y-auto"><p>This software is provided for <strong class="text-hud-text">educational and informational purposes only</strong>. Nothing in this software constitutes financial, investment, legal, or tax advice.</p> <p><strong class="text-hud-text">By using this software, you acknowledge and agree that:</strong></p> <ul class="list-disc pl-4 space-y-1"><li>All trading and investment decisions are made <strong class="text-hud-warning">at your own risk</strong></li> <li>Markets are volatile and <strong class="text-hud-error">you can lose some or all of your capital</strong></li> <li>No guarantees of performance, profits, or outcomes are made</li> <li>The authors, contributors, and maintainers are not responsible for any financial losses</li> <li>You are solely responsible for your own trades and investment decisions</li> <li>This software may contain bugs, errors, or behave unexpectedly</li> <li>Past performance does not guarantee future results</li></ul> <p><strong class="text-hud-error">If you do not fully understand the risks involved in trading or investing, you should not use this software.</strong></p> <p>No member, contributor, or operator of this project shall be held liable for losses of any kind.</p></div> <div class="flex items-start gap-2"><input type="checkbox" id="acceptDisclaimer"${attr("checked", disclaimerAccepted, true)} class="accent-hud-primary mt-1"/> <label for="acceptDisclaimer" class="text-xs text-hud-text">I have read and understand the risks. I accept full responsibility for any losses that may occur from using this software.</label></div> <div class="pt-4 border-t border-hud-line"><button class="hud-button w-full disabled:opacity-50 disabled:cursor-not-allowed"${attr("disabled", !disclaimerAccepted, true)}>I Understand, Continue</button></div></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    if (
      // Start polling once setup check completes (or after setup wizard)
      dashboard.showSetup
    ) {
      $$renderer2.push("<!--[-->");
      SetupWizard($$renderer2);
    } else {
      $$renderer2.push("<!--[!-->");
      if (dashboard.error && !dashboard.status) {
        $$renderer2.push("<!--[-->");
        ErrorScreen($$renderer2, { error: dashboard.error });
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<div class="min-h-screen bg-hud-bg"><div class="max-w-[1920px] mx-auto p-4">`);
        Header($$renderer2);
        $$renderer2.push(`<!----> <div class="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4"><div class="col-span-4 md:col-span-4 lg:col-span-3">`);
        AccountPanel($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-4 lg:col-span-5">`);
        PositionsPanel($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-8 lg:col-span-4">`);
        CostsPanel($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-8 lg:col-span-8">`);
        PortfolioChart($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-8 lg:col-span-4">`);
        PositionPerformance($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-4 lg:col-span-4">`);
        SignalsPanel($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-4 lg:col-span-4">`);
        ActivityFeed($$renderer2);
        $$renderer2.push(`<!----></div> <div class="col-span-4 md:col-span-8 lg:col-span-4">`);
        ResearchPanel($$renderer2);
        $$renderer2.push(`<!----></div></div> `);
        DashboardFooter($$renderer2);
        $$renderer2.push(`<!----></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
export {
  _page as default
};
