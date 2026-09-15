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

**Seller** is the only self-serve role. A new profile is forced to `seller` by
`protect_profile_privileged_columns()`, whatever the client posted.

**Buyer, advertiser and promoter** arrive through `review_application()`, which is
security definer and therefore passes the `is_admin()` short-circuit in that same
trigger. It is the only sanctioned path past the guard, alongside
`admin_set_role()` for the cases an application cannot express — correcting a
mistake, granting `both`, moving an account at its owner's request.

Approving a buyer application for an account that already sells produces `both`
rather than replacing the role. Somebody who lists and buys should not have to
lose their listings to get a feed.

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

- **Seller**: `/listings`, `/membership`, `/refer`, `/feedback`
- **Buyer**: `/buyer/*`, `/feedback`
- **Advertiser**: `/advertiser/*` and nothing else
- **Promoter**: `/promoter` and nothing else
- **Everyone signed in**: `/settings`, `/notifications`, `/apply`, `/onboarding`,
  `/directory`, `/verify-identity`
- **Administrators**: all of the above, plus `/admin/*`

Advertisers and promoters get no feedback surface: `may_give_feedback_as()` would
refuse the insert, so `feedbackSurfaceFor()` returns null and the button never
renders rather than rendering a form that fails.

## Adding a role

1. Add it to `ROLES` in `constants.ts` **and** to the CHECK constraint on
   `profiles.role` **and** to the CHECK on `onboarding_completions.role`.
2. Add an `is_<role>()` helper beside the others in the foundation migration.
3. Add its rules to `ACCESS_RULES` and its links to `NAV`.
4. If it is applied for: a table, the shared review-column trigger, policies
   copied from a neighbour, and a branch in `review_application()`.
5. Add a tour in `lib/onboarding.ts`. `onboarding.test.ts` checks every step it
   links to is somewhere that role may actually go.
