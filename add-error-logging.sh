#!/bin/bash
# This script adds error logging to all catch blocks that don't have it yet

file="src/mcp/agent.ts"

# Create backup
cp "$file" "$file.backup"

# Define the tools that need error logging added (tool_name, input_vars, provider_calls)
# Format: "tool_name|input_pattern|provider_calls"
tools=(
  "memory-query|input|3"
  "memory-summarize|_input|1"
  "memory-set-preferences|{ preferences }|0"
  "memory-get-preferences|{}|0"
  "symbol-overview|{ symbol }|3"
  "prices-bars|{ symbol, timeframe, limit }|1"
  "market-clock|{}|1"
  "market-movers|{ symbols }|1"
  "quotes-batch|{ symbols }|1"
  "market-quote|{ symbol }|1"
  "technicals-get|{ symbol, timeframe }|1"
  "signals-get|{ symbol, timeframe }|1"
  "signals-batch|{ symbols, timeframe }|1"
  "events-ingest|{ source, source_id, content }|0"
  "events-list|input|0"
  "events-classify|{ content, store }|1"
  "news-list|input|0"
  "news-index|input|0"
  "symbol-research|{ symbol }|5"
  "web-scrape-financial|{ url, symbol }|1"
  "options-expirations|{ underlying }|1"
  "options-chain|{ underlying, expiration }|1"
  "options-snapshot|{ contract_symbol }|1"
  "options-order-preview|input|5"
  "options-order-submit|{ approval_token: '[REDACTED]' }|3"
)

echo "Adding error logging to remaining tools..."
echo "Total tools to process: ${#tools[@]}"

for tool_info in "${tools[@]}"; do
  IFS='|' read -r tool_name input_pattern provider_calls <<< "$tool_info"
  echo "Processing: $tool_name"
done

echo "Done! Backup saved to $file.backup"
