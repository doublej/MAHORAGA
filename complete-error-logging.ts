/**
 * List of all remaining tools that need error logging added
 * Format: { toolName, startTimeNeeded, inputPattern, providerCalls }
 */

const remainingTools = [
  // Market Data
  { tool: 'market-clock', startTime: true, input: '{}', calls: 1 },
  { tool: 'market-movers', startTime: true, input: '{ symbols }', calls: 1 },
  { tool: 'quotes-batch', startTime: true, input: '{ symbols }', calls: 1 },
  { tool: 'market-quote', startTime: true, input: '{ symbol }', calls: 1 },

  // Technicals
  { tool: 'technicals-get', startTime: true, input: '{ symbol, timeframe }', calls: 1 },
  { tool: 'signals-get', startTime: true, input: '{ symbol, timeframe }', calls: 1 },
  { tool: 'signals-batch', startTime: true, input: '{ symbols, timeframe }', calls: 1 },

  // Events
  { tool: 'events-ingest', startTime: true, input: '{ source, source_id, content }', calls: 0 },
  { tool: 'events-list', startTime: true, input: 'input', calls: 0 },
  { tool: 'events-classify', startTime: true, input: '{ content, store }', calls: 1 },

  // News
  { tool: 'news-list', startTime: true, input: 'input', calls: 0 },
  { tool: 'news-index', startTime: true, input: 'input', calls: 0 },

  // Research
  { tool: 'web-scrape-financial', startTime: true, input: '{ url, symbol }', calls: 1 },

  // Options
  { tool: 'options-expirations', startTime: true, input: '{ underlying }', calls: 1 },
  { tool: 'options-chain', startTime: true, input: '{ underlying, expiration }', calls: 1 },
  { tool: 'options-snapshot', startTime: true, input: '{ contract_symbol }', calls: 1 },
];

console.log(`Total tools remaining: ${remainingTools.length}`);
console.log('Tools:', remainingTools.map(t => t.tool).join(', '));
