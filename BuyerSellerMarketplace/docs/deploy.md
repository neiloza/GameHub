# Deploying

Two halves, deployed separately: the web app, and the Supabase project behind it.

## Supabase

```bash
supabase link --project-ref <your-project-ref>
supabase db push                                   # applies supabase/migrations
supabase functions deploy billing-checkout billing-portal billing-webhook \
                          identity-verify identity-webhook \
                          notification-dispatch push-notify
supabase secrets set --env-file supabase/functions/.env
```

Then, in the dashboard:

- **Authentication → URL Configuration.** Site URL, and add both
  `https://yourdomain/auth/callback` *and* `https://yourdomain/auth/reset-password`
  to the redirect allowlist. Supabase matches the *final* redirect target, and an
  unlisted one is silently dropped back to the site URL — which looks exactly
  like a broken recovery email.
- **Authentication → Providers.** Enable Google and Apple if you want them, then
  set `NEXT_PUBLIC_ENABLE_SOCIAL_AUTH=true` in the web build. Leave it unset
  until they are on, or the buttons call providers that are switched off.
- **Webhooks.** Point your payment processor's webhook at
  `https://<project>.supabase.co/functions/v1/billing-webhook`, and the identity
  one at `identity-webhook`. They need separate signing secrets — sharing one
  means a single leak compromises both.
- **Scheduled function.** Run `notification-dispatch` (and `push-notify`, if you
  want push) every few minutes. Two copies running at once is safe.

Do **not** run `supabase/seed.sql` against a live project. It creates accounts.

## Web app (Cloudflare Pages)

```bash
pnpm --filter @marketplace/web pages:build
```

Build settings: build command `pnpm --filter @marketplace/web pages:build`,
output directory `apps/web/.vercel/output/static`, and the `nodejs_compat`
compatibility flag.

Environment variables must be set at **build** time — `NEXT_PUBLIC_*` values are
inlined into the bundle, not read at runtime, so changing one needs a rebuild:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ENABLE_SOCIAL_AUTH   (only once the providers are on)
```

The root layout declares `export const runtime = 'edge'`, which cascades to every
page. Route handlers do not inherit it and set their own — `auth/callback` does.

## Anywhere else

Nothing here is Cloudflare-specific apart from the `pages:build` script. `pnpm
build:web && pnpm --filter @marketplace/web start` is a normal Node server, and
any host that runs Next.js 15 will serve it. Drop the `runtime = 'edge'` export
if your host's Node runtime suits you better.

## Before you go live

- [ ] `enable_confirmations = true` in `supabase/config.toml` — an unverified
      address is an account somebody else may own.
- [ ] Custom SMTP configured, or password recovery silently fails.
- [ ] `TRIAL_ENABLED` and `FREE_LISTINGS` are what you mean them to be.
- [ ] The intro seat count in `intro_seats_remaining()` matches `INTRO_SEATS`.
- [ ] `/privacy` and `/terms` reviewed by a lawyer. They ship as templates with
      bracketed blanks, and they are not legal advice.
- [ ] At least one account has `is_admin = true` — set it directly in the
      dashboard, because nothing in the app grants the first one.
