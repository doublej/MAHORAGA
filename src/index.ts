import type { Env } from './env.d';
import { MahoragaMcpAgent } from './mcp/agent';
import { handleCronEvent } from './jobs/cron';
import { getHarnessStub } from './durable-objects/mahoraga-harness';
import { AUTH_UNAUTHORIZED_MESSAGE, isRequestAuthorized } from './lib/auth';

export { SessionDO } from './durable-objects/session';
export { MahoragaMcpAgent };
export { MahoragaHarness } from './durable-objects/mahoraga-harness';

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: AUTH_UNAUTHORIZED_MESSAGE }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (url.pathname.startsWith('/mcp')) {
      if (!(await isRequestAuthorized(request, env))) {
        return unauthorizedResponse();
      }
      return MahoragaMcpAgent.mount('/mcp', { binding: 'MCP_AGENT' }).fetch(request, env, ctx);
    }

    if (url.pathname.startsWith('/agent')) {
      const stub = getHarnessStub(env);
      const agentPath = url.pathname.replace('/agent', '') || '/status';
      const agentUrl = new URL(agentPath, 'http://harness');
      agentUrl.search = url.search;
      return stub.fetch(
        new Request(agentUrl.toString(), {
          method: request.method,
          headers: request.headers,
          body: request.body,
        })
      );
    }

    if (url.pathname === '/admin/warmup' && request.method === 'POST') {
      if (!(await isRequestAuthorized(request, env))) {
        return unauthorizedResponse();
      }

      try {
        const harness = getHarnessStub(env);
        const healthResponse = await harness.fetch(new Request('http://harness/health'));
        const healthData = (await healthResponse.json()) as {
          status: string;
          do_id: string;
          cf_colo: string;
        };

        return new Response(
          JSON.stringify({
            success: true,
            message: 'DOs initialized from current region',
            cf_ray: request.headers.get('cf-ray'),
            cf_colo: request.cf?.colo || 'unknown',
            do_colo: healthData.cf_colo,
            do_id: healthData.do_id,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: String(error),
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Serve dashboard static assets for all other routes
    return env.ASSETS.fetch(request);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cronId = event.cron;
    console.log(`Cron triggered: ${cronId} at ${new Date().toISOString()}`);
    ctx.waitUntil(handleCronEvent(cronId, env));
  },
};
