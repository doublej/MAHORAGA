import type { PortfolioSnapshot } from './types'

export function generateMockPortfolioHistory(equity: number, points = 24): PortfolioSnapshot[] {
  const history: PortfolioSnapshot[] = []
  const now = Date.now()
  const interval = 3600000
  let value = equity * 0.95

  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.45) * equity * 0.005
    value = Math.max(value + change, equity * 0.8)
    const pl = value - equity * 0.95
    history.push({
      timestamp: now - i * interval,
      equity: value,
      pl,
      pl_pct: (pl / (equity * 0.95)) * 100,
    })
  }

  history[history.length - 1] = {
    timestamp: now,
    equity,
    pl: equity - history[0].equity,
    pl_pct: ((equity - history[0].equity) / history[0].equity) * 100,
  }
  return history
}

export function generateMockPriceHistory(
  currentPrice: number,
  unrealizedPl: number,
  points = 20,
): number[] {
  const prices: number[] = []
  const isPositive = unrealizedPl >= 0
  const startPrice = currentPrice * (isPositive ? 0.95 : 1.05)

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const trend = startPrice + (currentPrice - startPrice) * progress
    const noise = trend * (Math.random() - 0.5) * 0.02
    prices.push(trend + noise)
  }
  prices[prices.length - 1] = currentPrice
  return prices
}
