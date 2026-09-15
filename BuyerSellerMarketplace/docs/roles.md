# The role model

Five parties, one column, and three different mechanisms enforcing it.

## `profiles.role`

```
seller | buyer | both | advertiser | promoter
```

Administrators are **not** a role. `profiles.is_admin` grants the console on top
of whatever role the account holds, which is why an admin still sees their own
role's navigation and previews others rather than seeing everything at once.

`both` is an account that sells and buys. It is a combination, not an experience
of its own — it is excluded from `PREVIEWABLE_ROLES`, and it is the reason
onboarding is keyed on `(profile_id, role)` rather than on the profile.

## How a role is acquired

**Buyer** is the only self-serve role. A new profile is forced to `buyer` by
`protect_profile_privileged_columns()`, whatever the client posted. Browsing and
buying are what a shop is for, and gating them behind a review would be absurd.

**Seller, advertiser and promoter** arrive through `review_application()`, which
is security definer and therefore passes the `is_admin()` short-circuit in that
same trigger. It is the only sanctioned path past the guard, alongside
`admin_set_role()` for the cases an application cannot express — correcting a
mistake, granting `both`, moving an account at its owner's request.

Approving a seller application produces `both` rather than `seller`, because the
account could already buy and opening a shop should not cost them that. In
practice `seller` alone only appears if an administrator sets it deliberately.

Two things guard the seller gate, and the order matters: the INSERT policy on
`listings` requires `is_seller()`, and `enforce_listing_limit()` checks it too.
A BEFORE trigger runs before RLS evaluates WITH CHECK, so without the second
check somebody still in the review queue is told they need a membership — true,
but not the reason, and it would send them to buy one that would not help.

## The three mechanisms

| Mechanism | Where | What it stops |
|---|---|---|
| The column guard | `protect_profile_privileged_columns()` | A member granting themselves a role |
| RLS policies | Every table | A member reading or writing rows for a role they do not hold |
| `canAccessPath()` | `packages/shared/src/lib/access.ts` | A member landing on an empty shell that looks broken |

Only the first two are security. The third is courtesy — everything it hides is
also empty.

## What each role reaches

The table in `access.ts` is the answer, and `access.test.ts` asserts it. In
summary:

- **Nobody in particular**: `/`, `/shop`, `/shop/:id`, the auth screens and the
  legal pages. These are not in the table at all — the catalogue is public, and
  published listings are readable by `anon` in the database to match.
- **Seller**: `/listings`, `/membership`, `/refer`
- **Advertiser**: `/advertiser/*` and nothing else
- **Promoter**: `/promoter` and nothing else
- **Everyone signed in**: `/messages`, `/feedback`, `/settings`, `/notifications`,
  `/apply`, `/onboarding`, `/directory`, `/verify-identity`
- **Administrators**: all of the above, plus `/admin/*`

`/messages` is open to every role because every account can buy, so every account
can have a thread. Advertisers and promoters still get no *feedback surface* —
they cannot buy or sell, `may_give_feedback_as()` would refuse the insert, and
`feedbackSurfaceFor()` returns null so the button never renders rather than
rendering a form that fails.

## Adding a role

1. Add it to `ROLES` in `constants.ts` **and** to the CHECK constraint on
   `profiles.role` **and** to the CHECK on `onboarding_completions.role`.
2. Add an `is_<role>()` helper beside the others in the foundation migration.
3. Add its rules to `ACCESS_RULES` and its links to `NAV`.
4. If it is applied for: a table, the shared review-column trigger, policies
   copied from a neighbour, and a branch in `review_application()`.
5. Add a tour in `lib/onboarding.ts`. `onboarding.test.ts` checks every step it
   links to is somewhere that role may actually go.
