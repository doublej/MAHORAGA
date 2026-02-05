const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/mcp/agent.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Tools that need startTime + error logging added
const tools = [
  { name: 'market-movers', input: '{ symbols }', calls: 1 },
  { name: 'quotes-batch', input: '{ symbols }', calls: 1 },
  { name: 'market-quote', input: '{ symbol }', calls: 1 },
  { name: 'technicals-get', input: '{ symbol, timeframe }', calls: 1 },
  { name: 'signals-get', input: '{ symbol, timeframe }', calls: 1 },
  { name: 'signals-batch', input: '{ symbols, timeframe }', calls: 1 },
  { name: 'events-ingest', input: '{ source, source_id, content }', calls: 0 },
  { name: 'events-list', input: 'input', calls: 0 },
  { name: 'events-classify', input: '{ content, store }', calls: 1 },
  { name: 'news-list', input: 'input', calls: 0 },
  { name: 'news-index', input: 'input', calls: 0 },
  { name: 'web-scrape-financial', input: '{ url, symbol }', calls: 1 },
  { name: 'options-expirations', input: '{ underlying }', calls: 1 },
  { name: 'options-chain', input: '{ underlying, expiration }', calls: 1 },
  { name: 'options-snapshot', input: '{ contract_symbol }', calls: 1 },
];

console.log(`Processing ${tools.length} tools...`);

for (const tool of tools) {
  console.log(`Adding error logging for: ${tool.name}`);

  // Pattern to find "} catch (error) {" followed by "return {" without "insertToolLog" in between
  const errorLogPattern = `await insertToolLog(db, {
            request_id: this.requestId,
            tool_name: '${tool.name}',
            input: ${tool.input},
            error: { code: ErrorCode.PROVIDER_ERROR, message: String(error) },
            latency_ms: Date.now() - startTime,
            provider_calls: ${tool.calls},
          });`;

  // This approach won't work well with regex. Manual edits are more reliable.
}

console.log('Done! (Note: Manual edits are recommended for accuracy)');
