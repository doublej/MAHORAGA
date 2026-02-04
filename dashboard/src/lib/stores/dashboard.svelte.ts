import { fetchStatus, fetchSetupStatus, saveConfig, fetchLogs } from '$lib/api'
import { generateMockPortfolioHistory, generateMockPriceHistory } from '$lib/mock'
import type { Config, PortfolioSnapshot, Status, LogEntry } from '$lib/types'

const POSITION_COLORS = ['cyan', 'purple', 'yellow', 'blue', 'green'] as const
type ChartVariant = (typeof POSITION_COLORS)[number]

class DashboardStore {
  status = $state<Status | null>(null)
  error = $state<string | null>(null)
  showSetup = $state(false)
  setupChecked = $state(false)
  time = $state(new Date())
  portfolioHistory = $state<PortfolioSnapshot[]>([])
  fullLogs = $state<LogEntry[]>([])
  logFilters = $state<{ agent?: string; action?: string; symbol?: string }>({})

  private pollInterval: ReturnType<typeof setInterval> | null = null
  private timeInterval: ReturnType<typeof setInterval> | null = null
  private priceHistoryCache: Record<string, number[]> = {}
  private priceHistoryCacheKey = ''

  // Derived state
  get account() {
    return this.status?.account ?? null
  }
  get positions() {
    return this.status?.positions ?? []
  }
  get signals() {
    return this.status?.signals ?? []
  }
  get logs() {
    return this.status?.logs ?? []
  }
  get costs() {
    return this.status?.costs ?? { total_usd: 0, calls: 0, tokens_in: 0, tokens_out: 0 }
  }
  get config() {
    return this.status?.config ?? null
  }
  get isMarketOpen() {
    if (this.config?.crypto_enabled) return true
    return this.status?.clock?.is_open ?? false
  }

  get startingEquity() {
    return this.config?.starting_equity || 100000
  }
  get unrealizedPl() {
    return this.positions.reduce((sum, p) => sum + p.unrealized_pl, 0)
  }
  get totalPl() {
    return this.account ? this.account.equity - this.startingEquity : 0
  }
  get realizedPl() {
    return this.totalPl - this.unrealizedPl
  }
  get totalPlPct() {
    return this.account ? (this.totalPl / this.startingEquity) * 100 : 0
  }

  get portfolioChartData() {
    return this.portfolioHistory.map((s) => s.equity)
  }
  get portfolioChartLabels() {
    return this.portfolioHistory.map((s) =>
      new Date(s.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    )
  }

  get positionPriceHistories(): Record<string, number[]> {
    const key = this.positions.map((p) => p.symbol).join(',')
    if (this.priceHistoryCacheKey !== key) {
      const histories: Record<string, number[]> = {}
      for (const pos of this.positions) {
        histories[pos.symbol] = generateMockPriceHistory(pos.current_price, pos.unrealized_pl)
      }
      this.priceHistoryCache = histories
      this.priceHistoryCacheKey = key
    }
    return this.priceHistoryCache
  }

  get normalizedPositionSeries(): {
    label: string
    data: number[]
    variant: ChartVariant
  }[] {
    return this.positions
      .slice(0, 5)
      .map((pos, idx) => {
        const priceHistory = this.positionPriceHistories[pos.symbol] || []
        if (priceHistory.length < 2) return null
        const startPrice = priceHistory[0]
        const normalizedData = priceHistory.map(
          (price) => ((price - startPrice) / startPrice) * 100,
        )
        return {
          label: pos.symbol,
          data: normalizedData,
          variant: POSITION_COLORS[idx % POSITION_COLORS.length],
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }

  get filteredLogs(): LogEntry[] {
    return this.fullLogs.filter((log) => {
      if (this.logFilters.agent && log.agent !== this.logFilters.agent) return false
      if (this.logFilters.action && log.action !== this.logFilters.action) return false
      if (
        this.logFilters.symbol &&
        !log.symbol?.toLowerCase().includes(this.logFilters.symbol.toLowerCase())
      )
        return false
      return true
    })
  }

  async checkSetup() {
    const { data } = await fetchSetupStatus()
    if (data && !data.configured) this.showSetup = true
    this.setupChecked = true
  }

  async poll() {
    const { data, error } = await fetchStatus()
    if (data) {
      this.status = data
      this.error = null
      this.updatePortfolioHistory(data)
    } else if (error) {
      this.error = error
    }
  }

  async fetchFullLogs(limit: number = 1000) {
    const { data } = await fetchLogs(limit)
    if (data) {
      this.fullLogs = data.logs
    }
  }

  private updatePortfolioHistory(data: Status) {
    if (!data.account) return

    if (this.portfolioHistory.length === 0) {
      this.portfolioHistory = generateMockPortfolioHistory(data.account.equity)
      return
    }

    const now = Date.now()
    const snapshot: PortfolioSnapshot = {
      timestamp: now,
      equity: data.account.equity,
      pl: data.account.equity - (this.portfolioHistory[0]?.equity || data.account.equity),
      pl_pct: this.portfolioHistory[0]
        ? ((data.account.equity - this.portfolioHistory[0].equity) /
            this.portfolioHistory[0].equity) *
          100
        : 0,
    }
    this.portfolioHistory = [...this.portfolioHistory, snapshot].slice(-48)
  }

  startPolling() {
    if (this.pollInterval) return
    this.poll()
    this.pollInterval = setInterval(() => this.poll(), 5000)
    this.timeInterval = setInterval(() => (this.time = new Date()), 1000)
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval)
    if (this.timeInterval) clearInterval(this.timeInterval)
    this.pollInterval = null
    this.timeInterval = null
  }

  async handleSaveConfig(config: Config) {
    const { data } = await saveConfig(config)
    if (data && this.status) {
      this.status = { ...this.status, config: data }
    }
  }

  completeSetup() {
    this.showSetup = false
  }
}

export const dashboard = new DashboardStore()
