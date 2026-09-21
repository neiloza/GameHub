import type { MemberRole, Role } from '../constants';

/**
 * First-run walkthroughs.
 *
 * One tour per member-facing role, shown the first time that role reaches its
 * home surface. The point is that someone arriving — a real signup or somebody
 * evaluating the product — sees the whole workflow end to end instead of an
 * empty state they have to reverse-engineer.
 *
 * Content lives here rather than in the page components for the usual reason:
 * it is data, it is asserted by unit tests, and one definition drives every
 * surface that renders a step. Every route named below exists.
 *
 * The copy is written for a generic marketplace and is meant to be rewritten.
 * The *structure* is the reusable part: a tour per role, keyed on the role
 * rather than the profile, so an account that gains a second role — which every
 * seller does, since they start as a buyer — gets the second walkthrough
 * instead of being marked "onboarded" for ever.
 */

export const ONBOARDING_ROLES = ['buyer', 'seller', 'advertiser', 'promoter'] as const;
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];

export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  /**
   * Where this step happens. Listing-scoped routes are written with a
   * `:listingId` placeholder and resolved by `resolveStepHref()`, since a
   * brand-new seller has no listing yet.
   */
  href?: string;
  /** Label for the "go there" affordance. Omitted for explanatory steps. */
  cta?: string;
};

export type OnboardingTour = {
  role: OnboardingRole;
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
};

const BUYER_TOUR: OnboardingTour = {
  role: 'buyer',
  title: 'Welcome',
  subtitle: 'Find it. Ask about it. Buy it.',
  steps: [
    {
      id: 'buyer-shop',
      title: 'Everything is in the shop',
      body: 'Search by words, narrow by category and condition, sort by price. No account is needed to look — you already have one, so you can also ask questions.',
      href: '/shop',
      cta: 'Open the shop',
    },
    {
      id: 'buyer-enquire',
      title: 'Ask the seller anything',
      body: 'Every listing has a contact form. It opens a thread with that seller about that item, and everything you have asked lives in one place.',
      href: '/messages',
      cta: 'See your messages',
    },
    {
      id: 'buyer-safety',
      title: 'Sellers cannot message you first',
      body: 'A conversation only exists because you started one. Nobody on this platform can put something in your inbox you did not ask for.',
    },
    {
      id: 'buyer-sell',
      title: 'Want to sell too?',
      body: 'Anybody can buy from the moment they sign up. Selling is reviewed by a person — apply and you keep your buying account alongside the shop.',
      href: '/apply/seller',
      cta: 'Apply to sell',
    },
  ],
};

const SELLER_TOUR: OnboardingTour = {
  role: 'seller',
  title: 'Your shop is open',
  subtitle: 'List it. Answer questions. Sell.',
  steps: [
    {
      id: 'seller-listing',
      title: 'Start with a listing',
      body: 'Name, category, condition and a price. Everything else is optional, and you can come back to it.',
      href: '/listings/new',
      cta: 'Create a listing',
    },
    {
      id: 'seller-publish',
      title: 'Publish when it is ready',
      body: 'A draft is yours alone. Publishing is what puts it in the shop, where anyone — signed in or not — can find it. You can unpublish at any time without losing the questions it has already attracted.',
      href: '/listings/:listingId/edit',
      cta: 'Finish your listing',
    },
    {
      id: 'seller-enquiries',
      title: 'Answer the people who ask',
      body: 'A shopper with a question opens a thread about one listing. Every thread on a listing sits together, so you are never guessing which item somebody means.',
      href: '/listings/:listingId/enquiries',
      cta: 'See your enquiries',
    },
    {
      id: 'seller-membership',
      title: 'What a membership is for',
      body: 'Browsing, buying, reading and sending messages and managing your account are free and always will be. A membership raises how many listings you can hold at once.',
      href: '/membership',
      cta: 'See membership',
    },
  ],
};

const ADVERTISER_TOUR: OnboardingTour = {
  role: 'advertiser',
  title: 'Welcome, advertiser',
  subtitle: 'Your placement, your numbers.',
  steps: [
    {
      id: 'advertiser-listing',
      title: 'Your listing is your presence here',
      body: 'Name, blurb, link and artwork. It is what appears in every slot you buy, and editing it updates every live placement at once.',
      href: '/advertiser',
      cta: 'Edit your listing',
    },
    {
      id: 'advertiser-campaigns',
      title: 'Buy a placement',
      body: 'Pick where and for how long. A campaign goes live once an administrator approves it, and you can pause it yourself at any time.',
      href: '/advertiser/campaigns',
      cta: 'Create a campaign',
    },
    {
      id: 'advertiser-leads',
      title: 'Members contact you first',
      body: 'You cannot browse or message sellers and buyers, and a lead only exists once a member chooses to click through. This is deliberate: no unsolicited approaches, ever.',
    },
  ],
};

const PROMOTER_TOUR: OnboardingTour = {
  role: 'promoter',
  title: 'Welcome, promoter',
  subtitle: 'Share the link. Get paid.',
  steps: [
    {
      id: 'promoter-welcome',
      title: 'Approved — two steps to go',
      body: 'Accept the agreement and confirm how you want to be paid. Your link works from today, but it only starts earning once both are done.',
      href: '/promoter',
      cta: 'Open your portal',
    },
    {
      id: 'promoter-link',
      title: 'Your link, and only your link',
      body: 'A code cannot be applied to your own account, and attribution follows the person from first visit through signup to paid membership.',
      href: '/promoter',
      cta: 'Copy your link',
    },
    {
      id: 'promoter-payment',
      title: 'Payment is arranged off-platform',
      body: 'We never ask for and never store your banking details. An administrator marks payment confirmed here, and that is what makes you active.',
    },
    {
      id: 'promoter-earnings',
      title: 'Paid on payment, not on signup',
      body: 'A referral qualifies when an invoice is actually paid, so an abandoned checkout earns nothing and a replayed billing event cannot pay twice. Your rate is snapshotted when the referral is created, so a later change never reprices what you already earned.',
      href: '/promoter',
      cta: 'View your earnings',
    },
  ],
};

export const ONBOARDING_TOURS: Record<OnboardingRole, OnboardingTour> = {
  buyer: BUYER_TOUR,
  seller: SELLER_TOUR,
  advertiser: ADVERTISER_TOUR,
  promoter: PROMOTER_TOUR,
};

/**
 * Which tours an account is owed.
 *
 * `both` returns two, buyer first — an account that buys and sells runs each
 * walkthrough separately and each is tracked on its own row, which is the whole
 * reason progress is keyed on the role. Administrators get none: the console is
 * not a first-run experience and an admin previewing a role should not be
 * interrupted by that role's tour.
 */
export function onboardingRolesFor({
  role,
  isAdmin = false,
}: {
  role: Role;
  isAdmin?: boolean;
}): OnboardingRole[] {
  if (isAdmin) return [];
  if (role === 'both') return ['buyer', 'seller'];
  return (ONBOARDING_ROLES as readonly string[]).includes(role)
    ? [role as OnboardingRole]
    : [];
}

/** A completion row, narrowed to what the pure logic needs. */
export type OnboardingProgress = {
  role: OnboardingRole;
  last_step: number;
  dismissed: boolean;
  completed_at: string | null;
};

/**
 * The tour to open right now, or null when the account is up to date.
 *
 * A tour counts as settled once it has been finished or explicitly skipped; a
 * half-finished row is resumed rather than restarted.
 */
export function pendingTour(
  account: { role: Role; isAdmin?: boolean },
  progress: OnboardingProgress[]
): OnboardingTour | null {
  const settled = new Set(
    progress.filter((p) => p.dismissed || p.completed_at !== null).map((p) => p.role)
  );
  const next = onboardingRolesFor(account).find((r) => !settled.has(r));
  return next ? ONBOARDING_TOURS[next] : null;
}

/** Where to resume a tour: the saved step, clamped to the steps that exist. */
export function resumeStepIndex(tour: OnboardingTour, progress?: OnboardingProgress): number {
  const saved = progress?.last_step ?? 0;
  if (!Number.isFinite(saved) || saved < 0) return 0;
  return Math.min(Math.floor(saved), tour.steps.length - 1);
}

/**
 * Fill in a listing-scoped route.
 *
 * Seller steps point at `/listings/:listingId/…`, which cannot be built until
 * the seller has a listing, so those steps lose their link until one exists
 * rather than sending anybody to a broken URL.
 */
export function resolveStepHref(
  step: OnboardingStep,
  ctx: { listingId?: string | null } = {}
): string | null {
  if (!step.href) return null;
  if (!step.href.includes(':listingId')) return step.href;
  if (!ctx.listingId) return null;
  return step.href.replace(':listingId', ctx.listingId);
}

/** The member roles that have a tour at all. Used by the settings "replay" list. */
export function hasTour(role: MemberRole): boolean {
  return (ONBOARDING_ROLES as readonly string[]).includes(role);
}
