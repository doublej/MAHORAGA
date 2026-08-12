#!/bin/sh
# Generate .dev.vars from environment variables so wrangler picks up secrets
{
  [ -n "$ALPACA_API_KEY" ] && echo "ALPACA_API_KEY=$ALPACA_API_KEY"
  [ -n "$ALPACA_API_SECRET" ] && echo "ALPACA_API_SECRET=$ALPACA_API_SECRET"
  [ -n "$MAHORAGA_API_TOKEN" ] && echo "MAHORAGA_API_TOKEN=$MAHORAGA_API_TOKEN"
  [ -n "$KILL_SWITCH_SECRET" ] && echo "KILL_SWITCH_SECRET=$KILL_SWITCH_SECRET"
  [ -n "$LLM_PROVIDER" ] && echo "LLM_PROVIDER=$LLM_PROVIDER"
  [ -n "$LLM_MODEL" ] && echo "LLM_MODEL=$LLM_MODEL"
  [ -n "$GOOGLE_CLOUD_PROJECT" ] && echo "GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT"
  [ -n "$GOOGLE_CLOUD_LOCATION" ] && echo "GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION"
  [ -n "$GOOGLE_SERVICE_ACCOUNT_EMAIL" ] && echo "GOOGLE_SERVICE_ACCOUNT_EMAIL=$GOOGLE_SERVICE_ACCOUNT_EMAIL"
  [ -n "$GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY" ] && echo "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=$GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
  [ -n "$OPENAI_API_KEY" ] && echo "OPENAI_API_KEY=$OPENAI_API_KEY"
  [ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
  [ -n "$TWITTER_BEARER_TOKEN" ] && echo "TWITTER_BEARER_TOKEN=$TWITTER_BEARER_TOKEN"
  [ -n "$DISCORD_WEBHOOK_URL" ] && echo "DISCORD_WEBHOOK_URL=$DISCORD_WEBHOOK_URL"
  [ -n "$ALPACA_PAPER" ] && echo "ALPACA_PAPER=$ALPACA_PAPER"
} > /app/.dev.vars

# Generate wrangler.jsonc from the example (bindings are local-dev only)
sed -e 's/<YOUR_D1_DATABASE_ID>/00000000-0000-0000-0000-000000000000/g' \
    -e 's/<YOUR_KV_NAMESPACE_ID>/00000000-0000-0000-0000-000000000000/g' \
    /app/wrangler.example.jsonc > /app/wrangler.jsonc

# Start dashboard dev server in background
cd /app/dashboard && npx vite dev --host 0.0.0.0 --port 3000 &

# Start wrangler in foreground
cd /app && exec npx wrangler dev --ip 0.0.0.0 --local