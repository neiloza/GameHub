import { NextResponse } from 'next/server';
import { safeRedirectPath } from '@marketplace/shared';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Route handlers don't inherit runtime from the root layout — set it here so
// this endpoint runs on the edge runtime under @cloudflare/next-on-pages.
export const runtime = 'edge';

/**
 * The one place an email link or an OAuth provider hands somebody back.
 *
 * Supabase sends two link shapes and which one arrives depends on the flow and
 * on the email template, not on anything this app controls:
 *
 *   ?code=<uuid>                    PKCE — OAuth, and the default email links
 *   ?token_hash=<hash>&type=<type>  the token-hash templates
 *
 * Both are handled, because a recovery email that lands in the shape this route
 * does not accept is a member who cannot get back into their account, and the
 * failure looks like a broken link rather than a missing branch.
 *
 * `type` is passed through to verifyOtp verbatim — `recovery`, `signup`,
 * `email_change`, `invite` and `magiclink` all arrive here, and Supabase is the
 * one that decides whether the hash matches the claimed type.
 */
type OtpType = 'recovery' | 'signup' | 'invite' | 'magiclink' | 'email_change';

const OTP_TYPES: readonly OtpType[] = ['recovery', 'signup', 'invite', 'magiclink', 'email_change'];

function isOtpType(value: string | null): value is OtpType {
  return !!value && (OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // `next` arrives from a link somebody was emailed, so it is narrowed to one
  // same-origin path before it is ever concatenated onto the origin.
  // See safeRedirectPath for what that refuses and why.
  const next = safeRedirectPath(searchParams.get('next'), '/onboarding');

  const supabase = await getSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // A failed exchange is nearly always an expired or already-used link, so the
  // sign-in page names that rather than reporting a generic failure — and
  // recovery says so in the words of the thing the member was trying to do.
  const reason =
    type === 'recovery' || next.startsWith('/auth/reset-password') ? 'recovery' : 'auth';
  return NextResponse.redirect(`${origin}/auth/sign-in?error=${reason}_link_invalid`);
}
