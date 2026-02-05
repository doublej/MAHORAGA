# MAHORAGA Token Limit Investigation & Fix Plan

**Created:** 2026-02-06
**Session Analysis:** 50 messages from Feb 4-5, 2026
**Current Issue:** LLM responses hitting token limits, producing incomplete JSON

---

## Timeline Context

### Previous Issues (Resolved in last 21 hours)
✅ **Feb 4-5:** OpenAI Responses API type mismatch (9 hours)
✅ **Feb 4-5:** Model classification causing wrong API routing (30 hours)
✅ **Feb 5:** Missing Alpaca `start` parameter (1 hour)

### Current Issue (Identified just now)
🔴 **Feb 6:** Token output limits causing 100% research failure
- **Duration:** Unknown (just discovered via application logs)
- **Symptom:** `finish_reason=length` → empty content errors
- **Impact:** All crypto/stock research failing with truncated JSON

---

## New Insights from Session Analysis

### Discovery #1: Two Separate Logging Systems
**Found:** MCP tool logs ≠ Application logs

1. **MCP Tool Logs** (what was retrieved first)
   - External tool calls TO Mahoraga
   - Stored in D1 database
   - Retrieved via `logs-get` MCP tool
   - Shows: `portfolio-get`, `symbol-research`, `accounts-get`

2. **Application Logs** (what user showed)
   - Internal agent activity INSIDE Mahoraga
   - Stored in Durable Object `state.logs` (last 500 entries)
   - NOT accessible via MCP tools
   - Shows: `research_error`, `research_skip`, agent activity

**Why this matters:** The actual errors are in application logs, not MCP logs. This is why the first query showed "no errors" but user's data showed hundreds of errors.

### Discovery #2: Error Pattern Evolution
**Timeline of error messages:**
1. Early errors: `OpenAI Chat Completions returned empty content` (no reason)
2. Mid errors: `OpenAI Chat Completions returned empty content (finish_reason=length)` ← TOKEN LIMIT
3. Later errors: `OpenAI Responses API: status=incomplete, reason=max_output_tokens` ← SAME ISSUE

**Pattern:** Errors transitioned from generic to specific as debugging context was added.

### Discovery #3: Root Cause is Clear
**Location:** `src/durable-objects/mahoraga-harness.ts`

```typescript
// LINE 1272 - Crypto research
max_tokens: 250  // ← TOO LOW for JSON response

// LINE 1714 - Signal research
max_tokens: 250  // ← TOO LOW for JSON response

// LINE 1884 - Position research
max_tokens: 200  // ← TOO LOW for JSON response

// LINE 2056 - Analyst decisions
max_tokens: 800  // ← MIGHT be enough, but borderline
```

**Problem:** LLM is trying to generate ~500-1000 token JSON responses but being cut off at 250 tokens mid-generation.

**Evidence from logs:**
- Empty `contentPreview` fields
- `finish_reason=length` (model hit limit)
- `status=incomplete, reason=max_output_tokens`
- Parse errors when trying to parse truncated JSON

---

## Questions to Answer Before Fixing

### Q1: Why weren't these limits hit before?
**Hypothesis:** Model behavior changed OR input prompts got longer, pushing output over limit.

**Need to check:**
- [ ] What model is actually being used? (config says `gpt-5-mini`)
- [ ] Are the prompts the same as before?
- [ ] Did prompt engineering guidance change? (e.g., "be detailed" vs "be concise")

**Investigation path:**
```bash
# Check actual model in use
grep -r "llm_model.*gpt" src/
# Check if prompts reference verbosity
grep -r "detailed\|verbose\|comprehensive" src/durable-objects/mahoraga-harness.ts
```

### Q2: What's the right token limit?
**Current limits:** 200-800 tokens
**Needed:** Enough for complete JSON + safety margin

**Need to determine:**
- [ ] Typical JSON response size from working calls
- [ ] Max reasonable JSON response size
- [ ] Safety margin for variations

**Investigation path:**
```bash
# Find any successful completions in logs
# Measure their token counts
# Add 50% safety margin
```

### Q3: Are there other bottlenecks?
**The default limit in openai.ts is 1024 tokens:**
```typescript
// Line 188: Responses API
max_output_tokens: params.max_tokens ?? 1024

// Line 254/256: Chat Completions
max_completion_tokens: params.max_tokens ?? 1024
```

**Need to verify:**
- [ ] If we increase to 1000 in harness, will openai.ts limit it back to 1024?
- [ ] Should we also increase the openai.ts defaults?
- [ ] Are there cost implications?

### Q4: Why didn't retry logic help?
**Existing retry in openai.ts (line 109-120):**
```typescript
const MAX_RETRIES = 2;
function isRetryableError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return msg.includes('empty content') || msg.includes('rate limit') || msg.includes('timeout');
}
```

**Issue:** `finish_reason=length` is NOT a transient error. Retrying with same parameters will always fail.

**Need to decide:**
- [ ] Should we add fallback logic? (retry with higher max_tokens?)
- [ ] Should we detect truncation and warn rather than retry?
- [ ] Should we add progressive token limit increases?

### Q5: How does this interact with the Responses API?
**From line 121-142 in openai.ts:**
```typescript
function extractResponsesText(data: OpenAIResponsesResponse): string {
  if (data.status && data.status !== 'completed') {
    const reason = data.incomplete_details?.reason || 'unknown';
    throw createError(
      ErrorCode.PROVIDER_ERROR,
      `OpenAI Responses API: status=${data.status}, reason=${reason}`
    );
  }
  // ...
}
```

**Different error paths:**
- Chat Completions: `finish_reason=length` → empty content error
- Responses API: `status=incomplete, reason=max_output_tokens` → status error

**Need to verify:**
- [ ] Which models use which API?
- [ ] Are token limits handled consistently?
- [ ] Should error messages be unified?

---

## Proposed Fix Plan

### Phase 1: Immediate Band-Aid (10 minutes)
**Goal:** Get system working again ASAP

**Action:**
```typescript
// In mahoraga-harness.ts
// LINE 1272 - Crypto research
max_tokens: 1000,  // Was: 250

// LINE 1714 - Signal research
max_tokens: 1000,  // Was: 250

// LINE 1884 - Position research
max_tokens: 800,   // Was: 200

// LINE 2056 - Analyst decisions
max_tokens: 1500,  // Was: 800
```

**Risk:** May increase costs by ~3-4x per call. Need to measure.

**Questions:**
- Will this break anything? (Probably not, just slower/more expensive)
- Should we increase openai.ts defaults too? (Not yet, these are overrides)

### Phase 2: Add Monitoring (30 minutes)
**Goal:** Understand actual token usage

**Action:** Add logging to track token usage per call type
```typescript
// After each LLM call, log:
this.log('LLM_Usage', 'token_stats', {
  operation: 'researchCrypto', // or researchSignal, etc.
  symbol,
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  max_tokens_requested: 1000,
  was_truncated: response.usage.completion_tokens >= 1000 * 0.95,
});
```

**Questions:**
- Where should these logs go? (Application logs or separate?)
- Should we expose this via MCP tools? (Yes, for debugging)
- Should we alert if >90% of limit used? (Yes, via Discord?)

### Phase 3: Dynamic Token Limits (1-2 hours)
**Goal:** Intelligently adjust limits based on context

**Action:** Calculate max_tokens based on prompt size
```typescript
function calculateMaxTokens(promptTokens: number, operation: string): number {
  // Rule: Reserve 2x prompt tokens for response (JSON is verbose)
  const minResponse = operation === 'analyst' ? 1000 : 500;
  const calculated = Math.max(minResponse, promptTokens * 2);

  // Cap at model limits
  const modelMax = this.state.config.llm_model.includes('gpt-5') ? 16000 : 4096;
  return Math.min(calculated, modelMax);
}
```

**Questions:**
- What's the right ratio? (prompt:response)
- Should this vary by operation? (Analyst needs more than research?)
- How do we handle edge cases? (Extremely long prompts?)

### Phase 4: Graceful Degradation (2-3 hours)
**Goal:** Handle truncation intelligently

**Action:** Add fallback logic for incomplete responses
```typescript
// Detect truncation
if (response.finish_reason === 'length' || response.status === 'incomplete') {
  // Option A: Retry with 2x tokens (up to max)
  // Option B: Return partial result with warning flag
  // Option C: Simplify prompt and retry

  this.log('LLM_Truncation', 'retry_with_higher_limit', {
    operation,
    original_max_tokens,
    new_max_tokens: original_max_tokens * 2,
  });
}
```

**Questions:**
- Which strategy is best? (Depends on use case)
- Should we cache failed attempts? (Avoid double-charging)
- How many retries before giving up? (1? 2?)

### Phase 5: Cost Analysis (1 hour)
**Goal:** Understand financial impact

**Action:** Calculate cost difference
```typescript
// Before: 250 tokens/call × $0.002/1K = $0.0005/call
// After:  1000 tokens/call × $0.002/1K = $0.002/call
// Increase: 4x cost per call

// Daily impact:
// Calls/day: ~1000 (estimated from logs)
// Cost before: $0.50/day
// Cost after: $2.00/day
// Delta: +$1.50/day = ~$45/month
```

**Questions:**
- Is this acceptable? (Need user input)
- Can we optimize elsewhere? (Cache results? Reduce frequency?)
- Should we make token limits configurable? (Via dashboard?)

---

## Implementation Order (Recommended)

### Step 1: Quick Fix + Deploy (NOW)
1. Change max_tokens values in mahoraga-harness.ts
2. Git commit: "fix: increase token limits for complete JSON responses"
3. Deploy via `npm run deploy`
4. Monitor application logs for 1 hour

**Expected outcome:** Errors drop to 0%, research starts working

**Rollback plan:** Git revert if costs spike unexpectedly

### Step 2: Add Monitoring (WITHIN 24 hours)
1. Add token usage logging
2. Deploy monitoring changes
3. Collect 24h of data
4. Analyze actual usage patterns

**Expected outcome:** Data-driven understanding of real token needs

### Step 3: Optimize (WITHIN 1 week)
1. Implement dynamic token limits based on monitoring data
2. Add graceful degradation for edge cases
3. Update dashboard to show token usage stats
4. Document recommended token limits in agent-config.example.json

**Expected outcome:** Cost-optimal token limits with safety margins

### Step 4: Document (CONTINUOUS)
1. Add comments explaining token limit rationale
2. Update CLAUDE.md with token limit tuning guidance
3. Create runbook for debugging token limit issues
4. Add alerting for >90% token usage

**Expected outcome:** Future maintainers can quickly diagnose token issues

---

## Open Questions for User

### Cost/Benefit Tradeoffs
**Q:** Are you OK with ~4x increase in LLM costs to fix this? (~$45/month extra)
- **Alternative 1:** Reduce research frequency (fewer calls = lower cost)
- **Alternative 2:** Use cheaper model for research (gpt-4o-mini instead of gpt-5-mini)
- **Alternative 3:** Implement caching (avoid redundant research calls)

### Feature Priorities
**Q:** Should we prioritize quick fix or proper solution?
- **Quick fix:** Change 4 numbers, deploy in 5 minutes (but may not be optimal)
- **Proper fix:** Analyze, implement dynamic limits, add monitoring (2-3 days)
- **Hybrid:** Quick fix now + proper fix over weekend?

### Monitoring Preferences
**Q:** How do you want to track token usage?
- **Dashboard:** Add panel showing token usage trends?
- **Discord:** Alert when >90% of limit used?
- **Logs only:** Just log to application logs for manual review?
- **MCP endpoint:** Create `token-usage-get` tool for programmatic monitoring?

### Model Selection
**Q:** Should we consider switching models to avoid this?
- Current: `gpt-5-mini` (seems to generate verbose outputs)
- Alternative 1: `gpt-4o-mini` (cheaper, might be more concise)
- Alternative 2: Claude Haiku (built for concise responses)
- Alternative 3: Stay with gpt-5-mini but add "be concise" to system prompts?

---

## Risk Assessment

### High Risk
🔴 **Increasing token limits without monitoring**
- Could spike costs unexpectedly
- Might hit other limits (rate limits, context windows)
- **Mitigation:** Add logging ASAP after quick fix

### Medium Risk
🟡 **Dynamic token limits might be too conservative**
- Could still truncate responses if calculations are wrong
- **Mitigation:** Test with diverse prompts, add safety margins

### Low Risk
🟢 **Quick fix breaking something else**
- Token limits are isolated parameters
- Worst case: slow responses or higher costs
- **Mitigation:** Easy rollback via git revert

---

## Success Metrics

### Immediate (After quick fix)
- [ ] Application log errors drop from 100% to <5%
- [ ] `research_skip` events decrease significantly
- [ ] `symbol-research` MCP tool returns full reports (not truncated)
- [ ] Dashboard shows research data populating

### Short-term (After monitoring)
- [ ] Average token usage per call type documented
- [ ] P50, P90, P99 token usage calculated
- [ ] Cost increase measured and validated
- [ ] Token limit recommendations added to docs

### Long-term (After optimization)
- [ ] Dynamic token limits deployed
- [ ] <1% of calls hit token limits
- [ ] Cost optimized to within 20% of baseline
- [ ] Zero manual interventions needed for token issues

---

## Next Steps

**Immediate (User decision needed):**
1. Approve quick fix approach (4x token increase)?
2. Set cost tolerance threshold (what's max acceptable $/month)?
3. Choose monitoring strategy (dashboard/discord/logs/MCP)?

**After approval:**
1. Implement changes in order listed above
2. Deploy and monitor
3. Iterate based on real data

**Questions to resolve:**
- See "Open Questions for User" section above
- See "Questions to Answer Before Fixing" section above
