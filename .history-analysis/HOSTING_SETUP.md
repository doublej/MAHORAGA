# MAHORAGA Hosting Setup & Tools

**Platform:** Cloudflare Workers (Serverless Edge Computing)
**Deployment URL:** https://mahoraga.jurrejan.workers.dev
**Account ID:** `015478e13d7ca9d81172aafcf5f199b6`

---

## Infrastructure Overview

### Core Platform: Cloudflare Workers
- **Runtime:** V8 isolate (JavaScript/TypeScript)
- **Execution:** Edge computing (runs in 300+ locations worldwide)
- **Startup:** ~45ms cold start
- **Limits:** 10ms CPU time per request (standard plan)
- **Pricing:** Free tier: 100K requests/day

### Storage Components

**1. Durable Objects (3 instances)**
- `SessionDO` - MCP session management
- `MahoragaMcpAgent` - MCP tool server
- `MahoragaHarness` - Main trading agent (THE BRAIN)
  - Persistent state across restarts
  - Single instance per account (singleton via ID)
  - Stores: config, logs (last 500), positions, signals, costs
  - Runs on alarm every 30 seconds

**2. D1 Database (SQLite)**
- **Name:** `mahoraga-db`
- **ID:** `51384f0b-c1a9-4d24-8d56-b06db35b3d14`
- **Tables:**
  - `mcp_logs` - MCP tool call logs
  - `trade_journal` - Trade history
  - `trade_outcomes` - Trade results
  - `user_preferences` - User settings
  - `structured_events` - Market events
  - `news_index` - News articles
- **Migrations:** 3 migration files in `/migrations/`
- **Size:** 5GB limit (far more than needed)

**3. KV Namespace (Key-Value Store)**
- **Binding:** `CACHE`
- **ID:** `0036a4af9f9c4f5fa68e06927d11f092`
- **Purpose:** Fast lookups (sentiment data, research cache)
- **TTL:** Configurable per key
- **Size:** 1GB limit per namespace

**4. Assets (Static Files)**
- **Directory:** `dashboard/build` (SvelteKit output)
- **Binding:** `ASSETS`
- **Type:** SPA (Single Page Application)
- **Size:** ~1.5MB total (21 files)
- **CDN:** Automatically distributed to all edge locations

---

## Deployment Configuration

### wrangler.jsonc Structure

```jsonc
{
  "name": "mahoraga",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],
  "account_id": "015478e13d7ca9d81172aafcf5f199b6",

  // Environment variables (public)
  "vars": {
    "ENVIRONMENT": "production",
    "FEATURE_LLM_RESEARCH": "true",
    "FEATURE_OPTIONS": "true",
    "DEFAULT_MAX_POSITION_PCT": "0.15",
    "DEFAULT_MAX_NOTIONAL_PER_TRADE": "10000",
    "DEFAULT_MAX_DAILY_LOSS_PCT": "0.03",
    "DEFAULT_COOLDOWN_MINUTES": "30",
    "DEFAULT_MAX_OPEN_POSITIONS": "10",
    "DEFAULT_APPROVAL_TTL_SECONDS": "300"
  },

  // Secrets (encrypted, set via CLI)
  // - ALPACA_API_KEY
  // - ALPACA_API_SECRET
  // - MAHORAGA_API_TOKEN
  // - KILL_SWITCH_SECRET
  // - OPENAI_API_KEY
  // - ALPACA_PAPER (optional)
  // - DISCORD_WEBHOOK_URL (optional)

  // Cron triggers (5 schedules)
  "triggers": {
    "crons": [
      "*/5 13-20 * * 1-5",  // Every 5 min during market hours (1-8pm UTC)
      "0 14 * * 1-5",       // Market open (2pm UTC / 9am EST)
      "30 21 * * 1-5",      // Market close (9:30pm UTC / 4:30pm EST)
      "0 5 * * *",          // Daily cleanup (5am UTC)
      "0 * * * *"           // Hourly health check
    ]
  },

  // Dashboard build process
  "build": {
    "command": "cd dashboard && npm run build"
  },

  // Smart placement for Durable Objects
  "placement": {
    "mode": "smart"  // Cloudflare picks optimal location
  }
}
```

---

## Deployment Tools & Commands

### Primary: Wrangler CLI

**Installation:** `npm install -g wrangler` (v4.61.1+)

**Core Commands:**

```bash
# Development (local)
npm run dev                      # Start local dev server on :8787
wrangler dev                     # Alternative direct command

# Database (D1)
npm run db:migrate               # Apply migrations locally
npm run db:migrate:remote        # Apply migrations to production
wrangler d1 execute mahoraga-db --remote --command 'SELECT * FROM mcp_logs LIMIT 10'

# Secrets Management
wrangler secret put ALPACA_API_KEY            # Interactive prompt
wrangler secret put ALPACA_API_SECRET
wrangler secret put MAHORAGA_API_TOKEN
wrangler secret put KILL_SWITCH_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret list                          # List all secrets (not values)

# Deployment
npm run deploy                   # Build + deploy to production
wrangler deploy                  # Direct deploy (skips npm build)
wrangler deploy --dry-run        # Preview without deploying

# Monitoring
wrangler tail                    # Stream live logs
wrangler tail --format pretty    # Formatted logs
wrangler tail --status error     # Only errors

# Durable Objects
wrangler d2 list                 # List all DOs (deprecated, use dashboard)
wrangler d2 sql <NAME>           # Query DO storage (experimental)

# KV
wrangler kv:key put --binding=CACHE "mykey" "myvalue"
wrangler kv:key get --binding=CACHE "mykey"
wrangler kv:key list --binding=CACHE

# Environment Info
wrangler whoami                  # Show current account
wrangler deployments list        # List recent deployments
```

---

## Monitoring & Debugging Tools

### 1. Cloudflare Dashboard
**URL:** https://dash.cloudflare.com/

**Key Sections:**
- **Workers & Pages** → Analytics
  - Request metrics (rate, errors, duration)
  - CPU time usage
  - Invocations by country
- **Workers & Pages** → Logs
  - Real-time log streaming
  - Filter by status code
  - Search by text
- **Durable Objects** → Storage
  - View DO instances
  - CPU/request metrics per DO
  - Alarm execution stats
- **D1** → mahoraga-db
  - Query browser
  - Storage size
  - Request metrics

### 2. wrangler tail (CLI)
**Best for:** Real-time debugging during development

```bash
# Stream all logs
wrangler tail

# Filter by log level
wrangler tail --status error

# Filter by text
wrangler tail | grep "research_error"

# Pretty format
wrangler tail --format pretty

# Save to file
wrangler tail > logs.txt
```

**Output Format:**
```
[2026-02-06 12:34:56.789] [Crypto] research_error {"symbol":"BTC/USD","error":"..."}
```

### 3. Custom Application Logs
**Endpoint:** `/agent/logs` (requires auth token)

```bash
export MAHORAGA_TOKEN="your_token"

# Get recent logs
curl -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  https://mahoraga.jurrejan.workers.dev/agent/logs

# Filter by time
curl -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  "https://mahoraga.jurrejan.workers.dev/agent/logs?hours=6"
```

**Data:** Last 500 log entries from Durable Object state

### 4. MCP Tools (via Claude Code)
```bash
# From Claude Code MCP client
mcp__mahoraga__logs-get          # MCP tool call logs
mcp__mahoraga__portfolio-get     # Current positions
mcp__mahoraga__risk-status       # Risk limits
```

### 5. Health Endpoints
```bash
# Public health check
curl https://mahoraga.jurrejan.workers.dev/health

# Agent status (requires auth)
curl -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  https://mahoraga.jurrejan.workers.dev/agent/status

# DO warmup (forces DO to start in current region)
curl -X POST -H "Authorization: Bearer $MAGORAGA_TOKEN" \
  https://mahoraga.jurrejan.workers.dev/admin/warmup
```

---

## Dashboard Hosting

### SvelteKit Static Adapter
**Build:** `cd dashboard && npm run build`
**Output:** `dashboard/build/` (static files)
**Served By:** Cloudflare Workers Assets binding

**Structure:**
```
dashboard/build/
├── _app/                # SvelteKit app chunks
│   ├── immutable/       # Versioned assets (long cache)
│   └── version.json     # Build timestamp
├── index.html           # Entry point
└── [other routes]
```

**Routing:** SPA mode (all routes serve `index.html`)
**CDN:** Automatically cached at edge locations
**Cache:** `immutable/` files cached permanently

---

## Secrets Management

### Local Development (.dev.vars)
```bash
# Create .dev.vars file
cat > .dev.vars << EOF
ALPACA_API_KEY=your_key
ALPACA_API_SECRET=your_secret
ALPACA_PAPER=true
OPENAI_API_KEY=sk-...
MAHORAGA_API_TOKEN=$(openssl rand -base64 48)
KILL_SWITCH_SECRET=$(openssl rand -base64 48)
EOF

# .dev.vars is gitignored (never commit)
```

### Production (Cloudflare Secrets)
```bash
# Set secrets via wrangler CLI (encrypted at rest)
wrangler secret put ALPACA_API_KEY
wrangler secret put ALPACA_API_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put MAHORAGA_API_TOKEN
wrangler secret put KILL_SWITCH_SECRET

# Optional secrets
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put ALPACA_PAPER

# List secrets (not values)
wrangler secret list

# Delete a secret
wrangler secret delete OLD_SECRET
```

**Security:**
- Secrets encrypted at rest
- Only accessible to Worker at runtime
- Not visible in dashboard or logs
- Rotating secrets requires re-deploying

---

## Cron Triggers

### Schedule Configuration

**Cron Expression Format:** `minute hour day month weekday`

```bash
"*/5 13-20 * * 1-5"    # Every 5 min, 1-8pm UTC, Mon-Fri (market hours)
"0 14 * * 1-5"         # 2pm UTC daily (market open 9am EST)
"30 21 * * 1-5"        # 9:30pm UTC daily (market close 4:30pm EST)
"0 5 * * *"            # 5am UTC daily (cleanup)
"0 * * * *"            # Every hour (health check)
```

**Handler:** `src/index.ts` → `scheduled()` export
**Execution:** Durable Object alarm handles actual work
**Timeout:** 30 seconds max per cron invocation

### Cron Management

```bash
# View cron triggers (in wrangler.jsonc or dashboard)
cat wrangler.jsonc | grep -A 7 "triggers"

# Test cron locally (not supported in wrangler dev)
# Use curl to manually trigger agent:
curl -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  http://localhost:8787/agent/tick
```

**Notes:**
- Cron triggers are UTC timezone
- No local testing (production only)
- Cloudflare guarantees at-least-once execution
- Failed cron jobs auto-retry with backoff

---

## Database Migrations

### D1 Migration System

**Location:** `/migrations/`

**Files:**
1. `0001_initial_schema.sql` - MCP logs table
2. `0002_memory_tables.sql` - Trade journal + preferences
3. `0003_events_tables.sql` - Events + news index

### Migration Commands

```bash
# Local (development)
npm run db:migrate                           # Apply to local D1
wrangler d1 migrations apply mahoraga-db --local

# Production
npm run db:migrate:remote                    # Apply to remote D1
wrangler d1 migrations apply mahoraga-db --remote

# Check migration status
wrangler d1 migrations list mahoraga-db
wrangler d1 migrations list mahoraga-db --remote

# Create new migration
wrangler d1 migrations create mahoraga-db "add_new_table"
# Edit generated migration file in /migrations/
```

### Migration Safety

**Important:**
- Migrations are irreversible (no automatic rollback)
- Test locally first: `npm run db:migrate`
- Backup before production: `wrangler d1 export mahoraga-db`
- Run remote migrations during off-hours

**Backup/Restore:**
```bash
# Backup
wrangler d1 export mahoraga-db --output backup.sql --remote

# Restore (requires manual SQL execution)
wrangler d1 execute mahoraga-db --remote --file backup.sql
```

---

## CI/CD Integration

### GitHub Actions (Example)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Required GitHub Secrets

- `CLOUDFLARE_API_TOKEN` - From Cloudflare dashboard → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` - `015478e13d7ca9d81172aafcf5f199b6`

**Permissions Needed:**
- Workers Scripts: Edit
- Account Settings: Read
- D1: Edit (if migrations in CI/CD)

---

## Cost Breakdown

### Cloudflare Workers

**Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- Bundled Durable Objects
- Bundled D1 reads

**Paid Tier ($5/month):**
- 10 million requests/month
- Unlimited CPU time (30s timeout)
- $0.02 per additional 1M requests
- $0.15 per 1M DO requests (over free tier)

**Current Usage Estimate:**
- ~1,000 requests/day (cron + dashboard + MCP)
- Well within free tier
- Durable Object requests: ~2,000/day (30s alarm)

**Cost:** $0/month (on free tier)

### D1 Database

**Free Tier:**
- 5GB storage
- 5 million rows read/day
- 100K rows written/day

**Current Usage:**
- ~100MB storage
- ~10K reads/day
- ~1K writes/day

**Cost:** $0/month (on free tier)

### KV Namespace

**Free Tier:**
- 100K reads/day
- 1K writes/day
- 1GB storage

**Current Usage:**
- ~5K reads/day
- ~100 writes/day
- ~10MB storage

**Cost:** $0/month (on free tier)

### Total Cloudflare Costs

**Current:** $0/month
**If upgraded to paid:** $5/month (Workers Paid plan)

### External API Costs

**OpenAI (gpt-5-mini):**
- $0.25 per 1M input tokens
- $2.00 per 1M output tokens
- Estimated: $1-2/day = ~$30-60/month

**Alpaca (Broker):**
- Free for paper trading
- No commission fees (real trading)
- SEC fees apply to sales (real trading)

**StockTwits/Reddit APIs:**
- Free (public data)

---

## Disaster Recovery

### Backups

**Durable Object State:**
- No automatic backups
- Ephemeral (lost if DO is deleted)
- **Mitigation:** Logs persisted to D1 database

**D1 Database:**
```bash
# Manual backup (run daily)
wrangler d1 export mahoraga-db --output backup-$(date +%Y%m%d).sql --remote

# Restore
wrangler d1 execute mahoraga-db --remote --file backup-20260206.sql
```

**Secrets:**
- Store in password manager
- Not backed up by Cloudflare
- **Mitigation:** Document in secure notes

### Rollback Procedure

```bash
# 1. Check recent deployments
wrangler deployments list

# 2. Rollback to previous version (dashboard only)
# Go to: Cloudflare Dashboard → Workers → Deployments → Rollback

# 3. OR: Deploy previous git commit
git checkout <previous-commit>
npm run deploy

# 4. Verify rollback
curl https://mahoraga.jurrejan.workers.dev/health
```

### Emergency Kill Switch

```bash
# Stop all trading immediately
export MAHORAGA_TOKEN="your_token"

curl -X POST -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  https://mahoraga.jurrejan.workers.dev/agent/kill-switch/enable \
  -d '{"reason":"Emergency stop"}'

# Verify
curl -H "Authorization: Bearer $MAHORAGA_TOKEN" \
  https://mahoraga.jurrejan.workers.dev/agent/status
# Should show: "kill_switch_active": true
```

---

## Useful Resources

### Documentation
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Durable Objects:** https://developers.cloudflare.com/durable-objects/
- **D1 Database:** https://developers.cloudflare.com/d1/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/

### Internal Docs
- **Architecture:** `/docs/architecture.html`
- **Configuration:** `/docs/configuration.html`
- **Getting Started:** `/docs/getting-started.html`
- **Extending:** `/docs/extending.html`

### Support
- **GitHub:** https://github.com/ygwyg/MAHORAGA
- **Discord:** https://discord.gg/Ys8KpsW5NN
- **Cloudflare Community:** https://community.cloudflare.com/

---

## Quick Reference

### Most Used Commands

```bash
# Development
npm run dev                      # Start local server
npm run deploy                   # Deploy to production
wrangler tail                    # Stream logs

# Secrets
wrangler secret put <NAME>       # Set secret
wrangler secret list             # List secrets

# Database
npm run db:migrate:remote        # Apply migrations
wrangler d1 execute mahoraga-db --remote --command 'SELECT * FROM table'

# Monitoring
curl https://mahoraga.jurrejan.workers.dev/health
curl -H "Authorization: Bearer $TOKEN" \
  https://mahoraga.jurrejan.workers.dev/agent/status
```

### Environment URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Production** | https://mahoraga.jurrejan.workers.dev | Live trading agent |
| **Local Dev** | http://localhost:8787 | Development server |
| **Dashboard** | https://mahoraga.jurrejan.workers.dev | Web UI (same as production) |
| **Dashboard Dev** | http://localhost:5173 | Local dashboard dev server |

### Key Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare configuration |
| `.dev.vars` | Local secrets (gitignored) |
| `src/index.ts` | Worker entry point |
| `src/durable-objects/mahoraga-harness.ts` | Main trading logic |
| `migrations/*.sql` | Database migrations |
| `package.json` | npm scripts + dependencies |
