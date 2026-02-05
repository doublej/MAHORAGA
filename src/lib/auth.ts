import type { Env } from '../env.d';

const ACCESS_ASSERTION_HEADER = 'CF-Access-Jwt-Assertion';
const ACCESS_CERTS_PATH = '/cdn-cgi/access/certs';
const DEFAULT_JWKS_TTL_MS = 5 * 60_000;
const CLOCK_SKEW_SECONDS = 60;

type EnvAuthConfig = Pick<Env, 'MAHORAGA_API_TOKEN' | 'CLOUDFLARE_ACCESS_AUD' | 'CF_ACCESS_AUD'>;

interface JwksResponse {
  keys: JsonWebKey[];
}

interface AccessJwtHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface AccessJwtPayload {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
}

interface ParsedJwt {
  header: AccessJwtHeader;
  payload: AccessJwtPayload;
  signature: Uint8Array;
  signingInput: Uint8Array;
}

interface CachedJwks {
  keys: JsonWebKey[];
  expiresAt: number;
}

const jwksCache = new Map<string, CachedJwks>();
const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export const AUTH_UNAUTHORIZED_MESSAGE =
  'Unauthorized. Provide Authorization: Bearer <MAHORAGA_API_TOKEN> or sign in through Cloudflare Access.';

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

export function isBearerTokenAuthorized(request: Request, expectedToken?: string): boolean {
  if (!expectedToken?.trim()) return false;
  const bearer = extractBearerToken(request);
  if (!bearer) return false;
  return constantTimeCompare(bearer, expectedToken);
}

function parseAudienceConfig(env: EnvAuthConfig): string[] {
  const configured = env.CLOUDFLARE_ACCESS_AUD ?? env.CF_ACCESS_AUD;
  if (!configured) return [];
  return configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function decodeBase64Url(part: string): Uint8Array {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${'='.repeat(padding)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJsonPart<T>(part: string): T | null {
  try {
    const bytes = decodeBase64Url(part);
    const json = textDecoder.decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function parseJwt(jwt: string): ParsedJwt | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  const header = decodeJsonPart<AccessJwtHeader>(headerB64);
  const payload = decodeJsonPart<AccessJwtPayload>(payloadB64);
  if (!header || !payload) return null;

  let signature: Uint8Array;
  try {
    signature = decodeBase64Url(signatureB64);
  } catch {
    return null;
  }

  return {
    header,
    payload,
    signature,
    signingInput: textEncoder.encode(`${headerB64}.${payloadB64}`),
  };
}

function parseCacheControlMaxAge(cacheControl: string | null): number | null {
  if (!cacheControl) return null;
  const match = cacheControl.match(/max-age=(\d+)/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}

function normalizeIssuer(rawIssuer: string): string | null {
  try {
    const issuer = new URL(rawIssuer);
    if (issuer.protocol !== 'https:') return null;
    if (issuer.username || issuer.password) return null;
    if (issuer.search || issuer.hash) return null;
    if (issuer.pathname !== '/' && issuer.pathname !== '') return null;
    const host = issuer.hostname.toLowerCase();
    if (!host.endsWith('.cloudflareaccess.com')) return null;
    return `https://${host}`;
  } catch {
    return null;
  }
}

function audienceMatchesClaim(claim: AccessJwtPayload['aud'], configured: string[]): boolean {
  if (!claim) return false;
  if (typeof claim === 'string') return configured.includes(claim);
  if (!Array.isArray(claim)) return false;
  return claim.some((audience) => configured.includes(audience));
}

async function getJwks(issuer: string, forceRefresh = false): Promise<JsonWebKey[]> {
  const now = Date.now();
  const cached = jwksCache.get(issuer);
  if (!forceRefresh && cached && cached.expiresAt > now) {
    return cached.keys;
  }

  try {
    const response = await fetch(`${issuer}${ACCESS_CERTS_PATH}`);
    if (!response.ok) return [];

    const data = (await response.json()) as Partial<JwksResponse>;
    const keys = Array.isArray(data.keys) ? data.keys : [];
    const maxAge = parseCacheControlMaxAge(response.headers.get('Cache-Control'));
    const ttlMs = maxAge ? maxAge * 1000 : DEFAULT_JWKS_TTL_MS;

    jwksCache.set(issuer, {
      keys,
      expiresAt: now + Math.max(10_000, ttlMs),
    });
    return keys;
  } catch {
    return [];
  }
}

async function verifyJwtSignature(parsed: ParsedJwt, key: JsonWebKey): Promise<boolean> {
  if (key.kty !== 'RSA') return false;
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, parsed.signature, parsed.signingInput);
}

function getJwkKid(key: JsonWebKey): string | undefined {
  const candidate = (key as { kid?: unknown }).kid;
  return typeof candidate === 'string' ? candidate : undefined;
}

export async function isCloudflareAccessAuthorized(
  request: Request,
  env: EnvAuthConfig
): Promise<boolean> {
  const assertion = request.headers.get(ACCESS_ASSERTION_HEADER)?.trim();
  if (!assertion) return false;

  const configuredAudiences = parseAudienceConfig(env);
  if (configuredAudiences.length === 0) return false;

  const parsed = parseJwt(assertion);
  if (!parsed) return false;

  if (parsed.header.alg !== 'RS256') return false;
  if (!parsed.header.kid) return false;

  const now = Math.floor(Date.now() / 1000);
  if (typeof parsed.payload.exp !== 'number' || parsed.payload.exp + CLOCK_SKEW_SECONDS < now) {
    return false;
  }
  if (typeof parsed.payload.nbf === 'number' && parsed.payload.nbf - CLOCK_SKEW_SECONDS > now) {
    return false;
  }
  if (typeof parsed.payload.iat === 'number' && parsed.payload.iat - CLOCK_SKEW_SECONDS > now) {
    return false;
  }

  if (!audienceMatchesClaim(parsed.payload.aud, configuredAudiences)) {
    return false;
  }

  if (typeof parsed.payload.iss !== 'string') return false;
  const issuer = normalizeIssuer(parsed.payload.iss);
  if (!issuer) return false;

  let keys = await getJwks(issuer);
  let key = keys.find((candidate) => getJwkKid(candidate) === parsed.header.kid);

  if (!key) {
    keys = await getJwks(issuer, true);
    key = keys.find((candidate) => getJwkKid(candidate) === parsed.header.kid);
  }

  if (!key) return false;

  try {
    return await verifyJwtSignature(parsed, key);
  } catch {
    return false;
  }
}

export async function isRequestAuthorized(request: Request, env: EnvAuthConfig): Promise<boolean> {
  if (isBearerTokenAuthorized(request, env.MAHORAGA_API_TOKEN)) {
    return true;
  }
  return isCloudflareAccessAuthorized(request, env);
}
