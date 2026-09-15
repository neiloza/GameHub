/**
 * The vocabulary the whole platform draws from.
 *
 * Every enum here is mirrored by a CHECK constraint in a migration and by a
 * zod enum in `schemas.ts`. Adding a value means touching all three — that is
 * deliberate: the database is the real boundary, so a value the schema accepts
 * and the database rejects is a runtime error rather than a type error.
 */

// ---------------------------------------------------------------------------
// roles
// ---------------------------------------------------------------------------

/**
 * The five parties this marketplace is built around.
 *
 * - `seller`     lists what is on offer and answers buyers who reach out.
 * - `buyer`      browses listings, expresses interest, and messages on a match.
 * - `both`       one account that sells and buys. A combination, not a party of
 *                its own — it is never previewed, and every `seller`/`buyer`
 *                check includes it.
 * - `advertiser` pays for placement. Reaches its own listing and nothing that
 *                belongs to a buyer or a seller.
 * - `promoter`   refers new members for a fee. Reaches its own portal only.
 *
 * Administrators are **not** a role: `profiles.is_admin` grants the console on
 * top of whatever role the account holds. The role is granted, never applied
 * for, which is why there is no admin sign-up anywhere in the app.
 */
export const ROLES = ['seller', 'buyer', 'both', 'advertiser', 'promoter'] as const;
export type Role = (typeof ROLES)[number];

/** Roles a member can actually sign up as — `both` is reached by applying. */
export const MEMBER_ROLES = ['seller', 'buyer', 'advertiser', 'promoter'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/**
 * Roles that arrive through an admin-reviewed application.
 *
 * `seller` is the only self-serve role: a new account is a seller until an
 * application is approved. `protect_profile_privileged_columns()` enforces that
 * in the database — see the role_integrity migration.
 */
export const APPLIED_ROLES = ['buyer', 'advertiser', 'promoter'] as const;
export type AppliedRole = (typeof APPLIED_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  seller: 'Seller',
  buyer: 'Buyer',
  both: 'Seller & buyer',
  advertiser: 'Advertiser',
  promoter: 'Promoter',
};

// ---------------------------------------------------------------------------
// listings
// ---------------------------------------------------------------------------

/**
 * Listing categories.
 *
 * One shared vocabulary for listing classification, buyer interests, matching,
 * search and filtering — these must be the same list, so every `category` /
 * `categories` column in the schema draws from here.
 *
 * This is the one enum in the file you are *expected* to replace: it is the
 * shape of a taxonomy, not a taxonomy anyone should inherit. Keep `other` last.
 */
export const CATEGORIES = [
  'automotive',
  'business_services',
  'construction',
  'consumer_products',
  'education_training',
  'energy_utilities',
  'entertainment_media',
  'fashion_apparel',
  'financial_services',
  'food_beverage',
  'health_wellness',
  'home_garden',
  'hospitality_travel',
  'industrial_manufacturing',
  'legal_professional',
  'logistics_transport',
  'marketing_advertising',
  'nonprofit_community',
  'pets_animals',
  'real_estate',
  'software_technology',
  'sports_recreation',
  'trades_home_services',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  automotive: 'Automotive',
  business_services: 'Business services',
  construction: 'Construction',
  consumer_products: 'Consumer products',
  education_training: 'Education & training',
  energy_utilities: 'Energy & utilities',
  entertainment_media: 'Entertainment & media',
  fashion_apparel: 'Fashion & apparel',
  financial_services: 'Financial services',
  food_beverage: 'Food & beverage',
  health_wellness: 'Health & wellness',
  home_garden: 'Home & garden',
  hospitality_travel: 'Hospitality & travel',
  industrial_manufacturing: 'Industrial & manufacturing',
  legal_professional: 'Legal & professional',
  logistics_transport: 'Logistics & transport',
  marketing_advertising: 'Marketing & advertising',
  nonprofit_community: 'Nonprofit & community',
  pets_animals: 'Pets & animals',
  real_estate: 'Real estate',
  software_technology: 'Software & technology',
  sports_recreation: 'Sports & recreation',
  trades_home_services: 'Trades & home services',
  other: 'Other',
};

/** How far along a listing is. Drives the buyer filter and the match score. */
export const LISTING_STAGES = ['concept', 'early', 'established', 'scaling'] as const;
export type ListingStage = (typeof LISTING_STAGES)[number];

export const LISTING_STAGE_LABELS: Record<ListingStage, string> = {
  concept: 'Concept',
  early: 'Early',
  established: 'Established',
  scaling: 'Scaling',
};

export const LISTING_STATUSES = ['draft', 'published', 'suspended'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

// ---------------------------------------------------------------------------
// discovery
// ---------------------------------------------------------------------------

export const SWIPE_DIRECTIONS = ['interested', 'pass'] as const;
export type SwipeDirection = (typeof SWIPE_DIRECTIONS)[number];

/** A seller's answer to a buyer who expressed interest. */
export const MATCH_STATUSES = ['pending', 'accepted', 'declined'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

// ---------------------------------------------------------------------------
// applications
// ---------------------------------------------------------------------------

/**
 * The review lifecycle shared by every application table.
 *
 * `info_requested` is the one worth explaining: an administrator can send the
 * application back with a question rather than rejecting it, and the applicant
 * answers in the same thread. Without it, "not quite enough detail" and "no"
 * are the same outcome, and the applicant reapplies from scratch.
 */
export const APPLICATION_STATUSES = [
  'pending',
  'info_requested',
  'approved',
  'rejected',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Under review',
  info_requested: 'More information needed',
  approved: 'Approved',
  rejected: 'Not approved',
};

/** What a buyer applicant says they are. Presentation and vetting only. */
export const BUYER_TYPES = [
  'individual',
  'business',
  'institution',
  'intermediary',
  'other',
] as const;
export type BuyerType = (typeof BUYER_TYPES)[number];

/** What a promoter applicant says they are. */
export const PROMOTER_TYPES = [
  'creator',
  'community',
  'agency',
  'consultant',
  'other',
] as const;
export type PromoterType = (typeof PROMOTER_TYPES)[number];

export const PROMOTER_PLATFORMS = [
  'website',
  'newsletter',
  'youtube',
  'instagram',
  'tiktok',
  'linkedin',
  'podcast',
  'in_person',
  'other',
] as const;
export type PromoterPlatform = (typeof PROMOTER_PLATFORMS)[number];

export const ESTIMATED_MONTHLY_REFERRALS = [
  'under_10',
  '10_to_50',
  '50_to_200',
  'over_200',
] as const;
export type EstimatedMonthlyReferrals = (typeof ESTIMATED_MONTHLY_REFERRALS)[number];

// ---------------------------------------------------------------------------
// advertising
// ---------------------------------------------------------------------------

/**
 * Where an ad may appear.
 *
 * A placement is a contract between `SponsorSlot` and the campaign rows: the
 * component asks for a placement by name and the query filters on it. Adding a
 * placement means adding it here, to the CHECK constraint, and rendering a slot
 * that asks for it — nothing is inferred.
 */
export const AD_PLACEMENTS = [
  'discovery_feed',
  'listing_detail',
  'dashboard',
  'directory',
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  discovery_feed: 'Discovery feed',
  listing_detail: 'Listing page',
  dashboard: 'Dashboard',
  directory: 'Directory',
};

export const AD_EVENT_KINDS = ['impression', 'click'] as const;
export type AdEventKind = (typeof AD_EVENT_KINDS)[number];

export const CAMPAIGN_STATUSES = ['draft', 'pending', 'active', 'paused', 'ended'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// ---------------------------------------------------------------------------
// membership and billing
// ---------------------------------------------------------------------------

/**
 * The plans that can be bought.
 *
 * This looks like a ladder and is not one: it is a single product billed
 * monthly or annually, at an introductory rate while early places remain and
 * the standard rate afterwards. There is no feature difference between any two
 * rows here, and `NEVER_GATED_CAPABILITIES` below is what keeps it that way.
 */
export const PURCHASABLE_PLANS = [
  'intro_monthly',
  'intro_annual',
  'standard_monthly',
  'standard_annual',
] as const;
export type PurchasablePlan = (typeof PURCHASABLE_PLANS)[number];

export const PLANS = ['none', ...PURCHASABLE_PLANS] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_PRICES_CENTS: Record<PurchasablePlan, number> = {
  intro_monthly: 4900,
  intro_annual: 49000,
  standard_monthly: 9900,
  standard_annual: 99000,
};

export const PLAN_LABELS: Record<PurchasablePlan, string> = {
  intro_monthly: 'Founding rate — monthly',
  intro_annual: 'Founding rate — annual',
  standard_monthly: 'Monthly',
  standard_annual: 'Annual',
};

/** How many accounts may buy at the introductory rate before it closes. */
export const INTRO_SEATS = 400;

/**
 * Membership states, mirroring the states a payment processor reports.
 *
 * `trialing` is a *state*, not a plan, so every gate that already asks
 * "is this membership active?" honours a trial without being changed. That is
 * the whole reason TRIAL_ENABLED below can be a one-line switch.
 */
export const MEMBERSHIP_STATES = [
  'none',
  'trialing',
  'active',
  'past_due',
  'canceled',
] as const;
export type MembershipState = (typeof MEMBERSHIP_STATES)[number];

/**
 * Capabilities that are free on every plan, for ever.
 *
 * `membership.test.ts` asserts that no entitlement check gates any of these, so
 * putting one behind a paywall is a failing build rather than a broken promise.
 * Delete an entry here only if you genuinely mean to start charging for it.
 */
export const NEVER_GATED_CAPABILITIES = [
  'browse_listings',
  'read_messages',
  'receive_notifications',
  'manage_account',
  'apply_for_a_role',
] as const;
export type NeverGatedCapability = (typeof NEVER_GATED_CAPABILITIES)[number];

/**
 * Built, tested, and deliberately off.
 *
 * Both exist so that turning one on later is a decision rather than a phase of
 * work. Neither has any effect while off.
 */

/** A 7-day free trial, as the membership *state* `trialing`. */
export const TRIAL_ENABLED = false;
export const TRIAL_DAYS = 7;

/**
 * How many listings a signed-up non-member may hold.
 *
 * Zero means "no free tier" in practice. Raising it to 1 is the whole of a
 * basic free tier: `lib/membership.ts` already branches on it and
 * `canAddListing()` already returns `membership_required` with the reason.
 */
export const FREE_LISTINGS = 0;

/** Per-feature caps that would apply to a free account, if one existed. */
export const FREE_LIMITS = {
  listings: FREE_LISTINGS,
  conversations: 0,
} as const;

/** Listings a paying member may hold. */
export const MEMBER_LISTING_LIMIT = 10;

// ---------------------------------------------------------------------------
// promoter rewards
// ---------------------------------------------------------------------------

/** Flat fee per qualified referral, in integer cents. Money is never a float. */
export const REFERRAL_FEE_CENTS = 2500;

/**
 * How long a referred signup has to convert before the referral stops counting.
 *
 * Attribution is last-touch within this window — see `lib/referrals.ts`.
 */
export const REFERRAL_ATTRIBUTION_DAYS = 60;

export const REFERRAL_STATUSES = [
  'pending',
  'qualified',
  'paid',
  'disqualified',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

/** Minimum balance before a payout run includes a promoter. */
export const MIN_PAYOUT_CENTS = 5000;

// ---------------------------------------------------------------------------
// trust and safety
// ---------------------------------------------------------------------------

export const REPORT_REASONS = [
  'spam',
  'harassment',
  'misleading',
  'impersonation',
  'off_platform_payment',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['open', 'reviewing', 'actioned', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'unstarted',
  'pending',
  'verified',
  'failed',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const ACCOUNT_STATUSES = ['active', 'suspended'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------

/**
 * Every notification the platform can send.
 *
 * `notification_category()` in the database maps each of these to a preference
 * group, and `lib/notifications.ts` maps it to copy and a link. A kind missing
 * from either is a notification nobody can turn off or click, so both are
 * exhaustive over this list and the tests check it.
 */
export const NOTIFICATION_KINDS = [
  'interest_received',
  'match_accepted',
  'match_declined',
  'message_received',
  'application_reviewed',
  'application_info_requested',
  'membership_started',
  'membership_trouble',
  'referral_qualified',
  'payout_sent',
  'listing_suspended',
  'identity_verified',
  'system_announcement',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Preference groups. A member turns off a category, not a single kind. */
export const NOTIFICATION_CATEGORIES = [
  'activity',
  'messages',
  'account',
  'marketing',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ---------------------------------------------------------------------------
// feedback
// ---------------------------------------------------------------------------

export const FEEDBACK_CATEGORIES = ['bug', 'idea', 'confusing', 'praise', 'other'] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_IMPACTS = ['blocking', 'annoying', 'minor'] as const;
export type FeedbackImpact = (typeof FEEDBACK_IMPACTS)[number];

export const FEEDBACK_STATUSES = ['new', 'triaged', 'planned', 'shipped', 'declined'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_TITLE_MAX = 140;
export const FEEDBACK_BODY_MAX = 4000;
export const FEEDBACK_RESPONSE_MAX = 4000;

// ---------------------------------------------------------------------------
// limits
// ---------------------------------------------------------------------------

export const MESSAGE_MAX = 4000;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
