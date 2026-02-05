<script lang="ts">
  import Panel from './Panel.svelte'
  import { dashboard } from '$lib/stores/dashboard.svelte'

  let { error }: { error: string } = $props()

  let isAuthError = $derived(error.includes('Unauthorized'))
  let apiToken = $state(localStorage.getItem('mahoraga_api_token') || '')

  function handleTokenSave() {
    const trimmed = apiToken.trim()
    if (trimmed) localStorage.setItem('mahoraga_api_token', trimmed)
    else localStorage.removeItem('mahoraga_api_token')
    apiToken = trimmed
    dashboard.poll()
  }

  function handleRetry() {
    dashboard.poll()
  }
</script>

<div class="min-h-screen bg-hud-bg flex items-center justify-center p-6">
  <Panel title={isAuthError ? 'AUTHENTICATION REQUIRED' : 'CONNECTION ERROR'} class="max-w-md w-full">
    <div class="text-center py-8">
      <div class="text-hud-error text-2xl mb-4">{isAuthError ? 'AUTH REQUIRED' : 'OFFLINE'}</div>
      <p class="text-hud-text-dim text-sm mb-6">{error}</p>
      {#if isAuthError}
        <div class="space-y-4">
          <div class="text-left bg-hud-panel p-4 border border-hud-line">
            <label class="hud-label block mb-2">API Token (Optional)</label>
            <input
              type="password"
              class="hud-input w-full mb-2"
              placeholder="Enter MAHORAGA_API_TOKEN"
              bind:value={apiToken}
            />
            <div class="grid grid-cols-2 gap-2">
              <button onclick={handleTokenSave} class="hud-button w-full">Save Token</button>
              <button onclick={handleRetry} class="hud-button w-full">Retry</button>
            </div>
          </div>
          <p class="text-hud-text-dim text-xs">
            Use either MAHORAGA_API_TOKEN or Cloudflare Access login.
          </p>
        </div>
      {:else}
        <p class="text-hud-text-dim text-xs">
          Enable the agent: <code class="text-hud-primary">curl -H "Authorization: Bearer $TOKEN" localhost:8787/agent/enable</code>
        </p>
      {/if}
    </div>
  </Panel>
</div>
