import { z } from 'zod';
import {
  AD_PLACEMENTS,
  APPLICATION_STATUSES,
  CATEGORIES,
  ESTIMATED_MONTHLY_REFERRALS,
  FEEDBACK_BODY_MAX,
  FEEDBACK_CATEGORIES,
  FEEDBACK_IMPACTS,
  FEEDBACK_RESPONSE_MAX,
  FEEDBACK_STATUSES,
  FEEDBACK_TITLE_MAX,
  LISTING_CONDITIONS,
  MESSAGE_MAX,
  PROMOTER_PLATFORMS,
  PROMOTER_TYPES,
  PURCHASABLE_PLANS,
  REPORT_REASONS,
  ROLES,
  SELLER_TYPES,
} from './constants';
import { FEEDBACK_SURFACES } from './lib/feedback';
import { isValidWebsite, normalizeWebsite } from './lib/website';

/**
 * Validation lives here and only here.
 *
 * Every write in `api/` parses its input through one of these before it reaches
 * the database, so a bad value is a readable error rather than a constraint
 * violation. The schemas mirror the CHECK constraints in the migrations — when
 * they disagree, the database wins, and the disagreement is a bug.
 */

/**
 * Website fields.
 *
 * `optionalWebsite` is the only way a website should be validated anywhere in
 * the product: it trims, accepts a bare domain, adds `https://` when the
 * protocol is missing, and stores one standardized form. Nothing else should
 * reach for `z.string().url()` on a website again — a member typing
 * `example.com` and being told "Invalid url" is the bug this prevents.
 */
const WEBSITE_MESSAGE = 'Enter a website like example.com';

export const optionalWebsite = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeWebsite(value) : value),
  z.string().max(500).refine(isValidWebsite, { message: WEBSITE_MESSAGE }).nullish()
);

export const requiredWebsite = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeWebsite(value) : value),
  z.string({ required_error: WEBSITE_MESSAGE }).max(500).refine(isValidWebsite, {
    message: WEBSITE_MESSAGE,
  })
);

/** Money is integer cents everywhere, never a float. */
const cents = z.number().int().nonnegative();

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------

export const profileSchema = z.object({
  role: z.enum(ROLES),
  display_name: z.string().trim().min(1, 'Display name is required').max(80),
  avatar_url: z.string().url().nullish(),
  bio: z.string().max(2000).nullish(),
  location: z.string().max(120).nullish(),
  website: optionalWebsite,
  links: z.record(z.string().url()).default({}),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * Account setup.
 *
 * `role` is deliberately absent. The database forces a new profile to `buyer`
 * regardless of what is posted (see `protect_profile_privileged_columns`), so
 * sending one would be a value that is silently discarded — worse than not
 * sending it, because it reads as if it worked.
 */
export const onboardingSchema = profileSchema.pick({
  display_name: true,
  location: true,
  bio: true,
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ---------------------------------------------------------------------------
// listings
// ---------------------------------------------------------------------------

export const listingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  tagline: z.string().max(140).nullish(),
  category: z.enum(CATEGORIES),
  condition: z.enum(LISTING_CONDITIONS).default('new'),
  location: z.string().max(120).nullish(),
  summary: z.string().max(4000).nullish(),
  details: z.string().max(8000).nullish(),
  website: optionalWebsite,
  // Required, matching the NOT NULL in the migration: a thing in a catalogue
  // has a price.
  price_cents: cents,
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code').default('USD'),
  // Null is "not tracked" (made to order, a service, a download); zero is
  // "tracked, and sold out". They read differently on the page, so they are
  // kept apart here rather than collapsed into one falsy value.
  stock_quantity: z.number().int().nonnegative().nullish(),
  cover_image_url: z.string().url().nullish(),
  // `suspended` is deliberately absent: only an administrator sets it, through
  // a trigger-guarded path, so it must not be reachable from a form.
  status: z.enum(['draft', 'published']).default('draft'),
});
export type ListingInput = z.infer<typeof listingSchema>;

/** What the catalogue accepts from a query string. */
export const catalogueQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(LISTING_CONDITIONS).optional(),
  min_cents: cents.optional(),
  max_cents: cents.optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.number().int().min(1).default(1),
});
export type CatalogueQuery = z.infer<typeof catalogueQuerySchema>;

// ---------------------------------------------------------------------------
// messaging
// ---------------------------------------------------------------------------

export const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Message cannot be empty').max(MESSAGE_MAX),
});
export type MessageInput = z.infer<typeof messageSchema>;

/** Opening an enquiry: a listing, and the first thing you want to ask about it. */
export const enquirySchema = z.object({
  listing_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Ask the seller something').max(MESSAGE_MAX),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const reportSchema = z.object({
  subject_profile_id: z.string().uuid().nullish(),
  subject_listing_id: z.string().uuid().nullish(),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().max(4000).nullish(),
});
export type ReportInput = z.infer<typeof reportSchema>;

// ---------------------------------------------------------------------------
// applications
// ---------------------------------------------------------------------------

/** What every application carries, whatever role it is for. */
const applicationBase = {
  contact_name: z.string().trim().min(1, 'Your name is required').max(120),
  contact_email: z.string().trim().email('Enter a valid email address').max(200),
  website: optionalWebsite,
  motivation: z.string().trim().min(1, 'Tell us a little about why').max(4000),
};

export const sellerApplicationSchema = z.object({
  ...applicationBase,
  shop_name: z.string().trim().min(1, 'Your shop needs a name').max(120),
  seller_type: z.enum(SELLER_TYPES),
  categories: z.array(z.enum(CATEGORIES)).min(1, 'Pick at least one category'),
  fulfilment_note: z.string().max(2000).nullish(),
});
export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;

export const advertiserApplicationSchema = z.object({
  ...applicationBase,
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  website: requiredWebsite,
  placements: z.array(z.enum(AD_PLACEMENTS)).min(1, 'Pick at least one placement'),
});
export type AdvertiserApplicationInput = z.infer<typeof advertiserApplicationSchema>;

export const promoterApplicationSchema = z.object({
  ...applicationBase,
  promoter_type: z.enum(PROMOTER_TYPES),
  platforms: z.array(z.enum(PROMOTER_PLATFORMS)).min(1, 'Pick at least one channel'),
  audience_size: z.number().int().nonnegative().nullish(),
  estimated_monthly_referrals: z.enum(ESTIMATED_MONTHLY_REFERRALS),
});
export type PromoterApplicationInput = z.infer<typeof promoterApplicationSchema>;

/**
 * A reviewer's decision.
 *
 * `note` is required on anything that is not an approval: "rejected, no reason
 * given" is the outcome applicants complain about, and it is also the one an
 * administrator cannot defend six months later.
 */
export const applicationReviewSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES),
    note: z.string().max(4000).nullish(),
  })
  .refine((r) => r.status === 'approved' || (r.note && r.note.trim().length > 0), {
    message: 'Say why — the applicant sees this',
    path: ['note'],
  });
export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;

export const applicationMessageSchema = z.object({
  application_id: z.string().uuid(),
  body: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});
export type ApplicationMessageInput = z.infer<typeof applicationMessageSchema>;

// ---------------------------------------------------------------------------
// advertising
// ---------------------------------------------------------------------------

export const advertiserProfileSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  blurb: z.string().trim().min(1, 'Say what you offer').max(400),
  website: requiredWebsite,
  logo_url: z.string().url().nullish(),
});
export type AdvertiserProfileInput = z.infer<typeof advertiserProfileSchema>;

export const campaignSchema = z
  .object({
    placement: z.enum(AD_PLACEMENTS),
    headline: z.string().trim().min(1, 'A headline is required').max(80),
    body: z.string().trim().min(1, 'Say something about the offer').max(240),
    destination_url: requiredWebsite,
    image_url: z.string().url().nullish(),
    starts_on: z.string().date(),
    ends_on: z.string().date(),
    budget_cents: cents,
  })
  .refine((c) => c.ends_on >= c.starts_on, {
    message: 'The end date cannot be before the start date',
    path: ['ends_on'],
  });
export type CampaignInput = z.infer<typeof campaignSchema>;

// ---------------------------------------------------------------------------
// membership
// ---------------------------------------------------------------------------

export const checkoutSchema = z.object({
  plan: z.enum(PURCHASABLE_PLANS),
  /** Where to send the member back to. Narrowed again server-side. */
  return_path: z.string().startsWith('/').max(500).default('/membership'),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------

export const notificationPreferencesSchema = z.object({
  email_activity: z.boolean().default(true),
  email_messages: z.boolean().default(true),
  email_account: z.boolean().default(true),
  email_marketing: z.boolean().default(false),
  push_activity: z.boolean().default(true),
  push_messages: z.boolean().default(true),
});
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const pushTokenSchema = z.object({
  token: z.string().trim().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
});
export type PushTokenInput = z.infer<typeof pushTokenSchema>;

// ---------------------------------------------------------------------------
// feedback
// ---------------------------------------------------------------------------

export const feedbackSchema = z.object({
  surface: z.enum(FEEDBACK_SURFACES),
  category: z.enum(FEEDBACK_CATEGORIES),
  impact: z.enum(FEEDBACK_IMPACTS),
  title: z.string().trim().min(1, 'A one-line summary helps').max(FEEDBACK_TITLE_MAX),
  body: z.string().trim().min(1, 'Tell us what happened').max(FEEDBACK_BODY_MAX),
  /** Captured automatically so a report can be reproduced. */
  pathname: z.string().max(500).nullish(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackResponseSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
  response: z.string().max(FEEDBACK_RESPONSE_MAX).nullish(),
});
export type FeedbackResponseInput = z.infer<typeof feedbackResponseSchema>;

