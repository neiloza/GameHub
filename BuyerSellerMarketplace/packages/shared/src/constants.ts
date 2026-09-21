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
 * - `buyer`      browses the catalogue and asks sellers about what they list.
 *                The default: anybody who signs up can buy, without review.
 * - `seller`     lists what is on offer and answers the people who ask. Vetted,
 *                because a shop is answerable for what is on its shelves.
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
export const ROLES = ['buyer', 'seller', 'both', 'advertiser', 'promoter'] as const;
export type Role = (typeof ROLES)[number];

/** Roles a member can end up holding — `both` is reached by applying to sell. */
export const MEMBER_ROLES = ['buyer', 'seller', 'advertiser', 'promoter'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/**
 * Roles that arrive through an admin-reviewed application.
 *
 * `buyer` is the only self-serve role: a new account is a buyer, because
 * browsing and buying are what a shop is for and gating them behind a review
 * would be absurd. Selling, advertising and promoting are all reviewed.
 * `protect_profile_privileged_columns()` enforces that in the database.
 */
export const APPLIED_ROLES = ['seller', 'advertiser', 'promoter'] as const;
export type AppliedRole = (typeof APPLIED_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  both: 'Buyer & seller',
  advertiser: 'Advertiser',
  promoter: 'Promoter',
};

// ---------------------------------------------------------------------------
// listings
// ---------------------------------------------------------------------------

/**
 * Listing categories.
 *
 * One shared vocabulary for classifying a listing, filtering the catalogue and
 * asking a seller applicant what they intend to sell — these must be the same
 * list, so every `category` / `categories` column in the schema draws from here.
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

/**
 * What state the thing is in. One of the two filters the catalogue offers.
 *
 * Chosen to cover both ends of the marketplaces this is built for: a used-goods
 * site needs `used` and `refurbished`, a print-on-demand one needs
 * `made_to_order`, and most catalogues only ever use `new`.
 */
export const LISTING_CONDITIONS = ['new', 'used', 'refurbished', 'made_to_order'] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export const LISTING_CONDITION_LABELS: Record<ListingCondition, string> = {
  new: 'New',
  used: 'Used',
  refurbished: 'Refurbished',
  made_to_order: 'Made to order',
};

/** How a shopper can order the catalogue. */
export const CATALOGUE_SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type CatalogueSort = (typeof CATALOGUE_SORTS)[number];

export const CATALOGUE_SORT_LABELS: Record<CatalogueSort, string> = {
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

/** How many listings a catalogue page holds. */
export const CATALOGUE_PAGE_SIZE = 24;

export const LISTING_STATUSES = ['draft', 'published', 'suspended'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

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

/** What a seller applicant says they are. Presentation and vetting only. */
export const SELLER_TYPES = [
  'individual',
  'business',
  'artist',
  'reseller',
  'other',
] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const SELLER_TYPE_LABELS: Record<SellerType, string> = {
  individual: 'An individual',
  business: 'A business',
  artist: 'An artist or maker',
  reseller: 'A reseller',
  other: 'Something else',
};

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
  'catalogue',
  'listing_detail',
  'dashboard',
  'directory',
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  catalogue: 'Shop',
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
  'enquiry_received',
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
