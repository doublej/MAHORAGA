import "clsx";
import { w as attr_class, y as stringify } from "./index.js";
import { l as escape_html } from "./context.js";
function getApiBase() {
  return localStorage.getItem("mahoraga_backend_url") || "/agent";
}
function getApiToken() {
  return localStorage.getItem("mahoraga_api_token")?.trim() || window.VITE_MAHORAGA_API_TOKEN?.trim() || "";
}
function authFetch(url, options = {}) {
  const token = getApiToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...options, headers });
}
async function fetchStatus() {
  try {
    const res = await authFetch(`${getApiBase()}/status`);
    const json = await res.json();
    if (json.ok) return { data: json.data, error: null };
    return { data: null, error: json.error || "Failed to fetch status" };
  } catch {
    return { data: null, error: "Connection failed - is the agent running?" };
  }
}
async function fetchSetupStatus() {
  try {
    const res = await authFetch(`${getApiBase()}/setup/status`);
    const json = await res.json();
    if (json.ok) return { data: json.data, error: null };
    return { data: null, error: json.error || "Failed to check setup" };
  } catch {
    return { data: null, error: "Connection failed" };
  }
}
async function saveConfig(config) {
  try {
    const res = await authFetch(`${getApiBase()}/config`, {
      method: "POST",
      body: JSON.stringify(config)
    });
    const json = await res.json();
    if (json.ok) return { data: json.data, error: null };
    return { data: null, error: json.error || "Failed to save config" };
  } catch {
    return { data: null, error: "Connection failed" };
  }
}
function generateMockPortfolioHistory(equity, points = 24) {
  const history = [];
  const now = Date.now();
  const interval = 36e5;
  let value = equity * 0.95;
  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.45) * equity * 5e-3;
    value = Math.max(value + change, equity * 0.8);
    const pl = value - equity * 0.95;
    history.push({
      timestamp: now - i * interval,
      equity: value,
      pl,
      pl_pct: pl / (equity * 0.95) * 100
    });
  }
  history[history.length - 1] = {
    timestamp: now,
    equity,
    pl: equity - history[0].equity,
    pl_pct: (equity - history[0].equity) / history[0].equity * 100
  };
  return history;
}
function generateMockPriceHistory(currentPrice, unrealizedPl, points = 20) {
  const prices = [];
  const isPositive = unrealizedPl >= 0;
  const startPrice = currentPrice * (isPositive ? 0.95 : 1.05);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const trend = startPrice + (currentPrice - startPrice) * progress;
    const noise = trend * (Math.random() - 0.5) * 0.02;
    prices.push(trend + noise);
  }
  prices[prices.length - 1] = currentPrice;
  return prices;
}
const POSITION_COLORS = ["cyan", "purple", "yellow", "blue", "green"];
class DashboardStore {
  status = null;
  error = null;
  showSetup = false;
  setupChecked = false;
  time = /* @__PURE__ */ new Date();
  portfolioHistory = [];
  pollInterval = null;
  timeInterval = null;
  priceHistoryCache = {};
  priceHistoryCacheKey = "";
  // Derived state
  get account() {
    return this.status?.account ?? null;
  }
  get positions() {
    return this.status?.positions ?? [];
  }
  get signals() {
    return this.status?.signals ?? [];
  }
  get logs() {
    return this.status?.logs ?? [];
  }
  get costs() {
    return this.status?.costs ?? { total_usd: 0, calls: 0, tokens_in: 0, tokens_out: 0 };
  }
  get config() {
    return this.status?.config ?? null;
  }
  get isMarketOpen() {
    if (this.config?.crypto_enabled) return true;
    return this.status?.clock?.is_open ?? false;
  }
  get startingEquity() {
    return this.config?.starting_equity || 1e5;
  }
  get unrealizedPl() {
    return this.positions.reduce((sum, p) => sum + p.unrealized_pl, 0);
  }
  get totalPl() {
    return this.account ? this.account.equity - this.startingEquity : 0;
  }
  get realizedPl() {
    return this.totalPl - this.unrealizedPl;
  }
  get totalPlPct() {
    return this.account ? this.totalPl / this.startingEquity * 100 : 0;
  }
  get portfolioChartData() {
    return this.portfolioHistory.map((s) => s.equity);
  }
  get portfolioChartLabels() {
    return this.portfolioHistory.map((s) => new Date(s.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
  }
  get positionPriceHistories() {
    const key = this.positions.map((p) => p.symbol).join(",");
    if (this.priceHistoryCacheKey !== key) {
      const histories = {};
      for (const pos of this.positions) {
        histories[pos.symbol] = generateMockPriceHistory(pos.current_price, pos.unrealized_pl);
      }
      this.priceHistoryCache = histories;
      this.priceHistoryCacheKey = key;
    }
    return this.priceHistoryCache;
  }
  get normalizedPositionSeries() {
    return this.positions.slice(0, 5).map((pos, idx) => {
      const priceHistory = this.positionPriceHistories[pos.symbol] || [];
      if (priceHistory.length < 2) return null;
      const startPrice = priceHistory[0];
      const normalizedData = priceHistory.map((price) => (price - startPrice) / startPrice * 100);
      return {
        label: pos.symbol,
        data: normalizedData,
        variant: POSITION_COLORS[idx % POSITION_COLORS.length]
      };
    }).filter((s) => s !== null);
  }
  async checkSetup() {
    const { data } = await fetchSetupStatus();
    if (data && !data.configured) this.showSetup = true;
    this.setupChecked = true;
  }
  async poll() {
    const { data, error } = await fetchStatus();
    if (data) {
      this.status = data;
      this.error = null;
      this.updatePortfolioHistory(data);
    } else if (error) {
      this.error = error;
    }
  }
  updatePortfolioHistory(data) {
    if (!data.account) return;
    if (this.portfolioHistory.length === 0) {
      this.portfolioHistory = generateMockPortfolioHistory(data.account.equity);
      return;
    }
    const now = Date.now();
    const snapshot = {
      timestamp: now,
      equity: data.account.equity,
      pl: data.account.equity - (this.portfolioHistory[0]?.equity || data.account.equity),
      pl_pct: this.portfolioHistory[0] ? (data.account.equity - this.portfolioHistory[0].equity) / this.portfolioHistory[0].equity * 100 : 0
    };
    this.portfolioHistory = [...this.portfolioHistory, snapshot].slice(-48);
  }
  startPolling() {
    if (this.pollInterval) return;
    this.poll();
    this.pollInterval = setInterval(() => this.poll(), 5e3);
    this.timeInterval = setInterval(() => this.time = /* @__PURE__ */ new Date(), 1e3);
  }
  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.pollInterval = null;
    this.timeInterval = null;
  }
  async handleSaveConfig(config) {
    const { data } = await saveConfig(config);
    if (data && this.status) {
      this.status = { ...this.status, config: data };
    }
  }
  completeSetup() {
    this.showSetup = false;
  }
}
const dashboard = new DashboardStore();
function StatusIndicator($$renderer, $$props) {
  const statusColors = {
    active: "bg-hud-success",
    warning: "bg-hud-warning",
    error: "bg-hud-error",
    inactive: "bg-hud-dim"
  };
  let { status, label, pulse = false, class: className = "" } = $$props;
  $$renderer.push(`<div${attr_class(`flex items-center gap-2 ${stringify(className)}`)}><div class="relative"><div${attr_class(`w-2 h-2 rounded-full ${stringify(statusColors[status])}`)}></div> `);
  if (pulse && status === "active") {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div${attr_class(`absolute inset-0 w-2 h-2 rounded-full animate-ping ${stringify(statusColors[status])} opacity-75`)}></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div> `);
  if (label) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<span class="hud-label">${escape_html(label)}</span>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
function Panel($$renderer, $$props) {
  let {
    children,
    title,
    titleRight,
    class: className = "",
    noPadding = false
  } = $$props;
  $$renderer.push(`<div${attr_class(`hud-panel flex flex-col ${stringify(className)}`)}>`);
  if (title || titleRight) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div class="flex justify-between items-center px-4 py-2 border-b border-hud-line shrink-0">`);
    if (title) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<span class="hud-label">${escape_html(title)}</span>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--> `);
    if (titleRight) {
      $$renderer.push("<!--[-->");
      if (typeof titleRight === "string") {
        $$renderer.push("<!--[-->");
        $$renderer.push(`<span class="hud-value-sm">${escape_html(titleRight)}</span>`);
      } else {
        $$renderer.push("<!--[!-->");
        titleRight($$renderer);
        $$renderer.push(`<!---->`);
      }
      $$renderer.push(`<!--]-->`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> <div${attr_class(`flex-1 min-h-0 ${stringify(noPadding ? "" : "p-3")}`)}>`);
  children($$renderer);
  $$renderer.push(`<!----></div></div>`);
}
export {
  Panel as P,
  StatusIndicator as S,
  dashboard as d
};
