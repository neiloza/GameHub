import { createClient } from 'npm:@supabase/supabase-js@2';

/** A client acting as the calling user, with RLS enforced. */
export function userClient(req: Request) {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });
}

/**
 * The service-role client. Bypasses RLS entirely.
 *
 * Never returned to a caller, never used to fetch something the user client
 * could have fetched. It exists for the two things RLS deliberately forbids to
 * everybody: writing a membership, and recording a verification outcome.
 */
export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Narrow a caller-supplied return path to one same-origin path.
 *
 * The same rule as `safeRedirectPath` in the shared package, repeated because
 * an edge function cannot import from the workspace. A processor sends the
 * member back to whatever URL we hand it, so a path from the request body is
 * attacker-influenced in exactly the way an open redirect needs.
 */
export function safeReturnUrl(siteUrl: string, path: unknown): string {
  const base = siteUrl.replace(/\/+$/, '');
  if (typeof path !== 'string') return base;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return base;
  if (/^\/\//.test(trimmed) || /^\/\\/.test(trimmed)) return base;
  // deno-lint-ignore no-control-regex
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return base;
  return base + trimmed;
}
