/**
 * The database as TypeScript.
 *
 * Hand-maintained against `supabase/migrations`, in the shape
 * `@supabase/supabase-js` expects, so every query in `api/` is typed end to
 * end. Regenerate-or-handwrite is a real choice and this project handwrites:
 * the generated file is 10x the size, loses every comment, and re-generating it
 * is a step people forget — a wrong type here shows up as a failing typecheck
 * the moment a migration lands, which is the point.
 *
 * Conventions the whole schema follows:
 *   - money is integer cents in a `bigint`, never a float
 *   - timestamps are `timestamptz`, always UTC, surfaced as ISO strings
 *   - every table has RLS enabled and at least one policy
 */

import type {
  AccountStatus,
  AdEventKind,
  AdPlacement,
  ApplicationStatus,
  CampaignStatus,
  Category,
  EstimatedMonthlyReferrals,
  FeedbackCategory,
  FeedbackImpact,
  FeedbackStatus,
  ListingCondition,
  ListingStatus,
  MembershipState,
  NotificationChannel,
  Plan,
  PromoterPlatform,
  PromoterType,
  ReferralStatus,
  ReportReason,
  ReportStatus,
  Role,
  SellerType,
  VerificationStatus,
} from '../constants';
import type { FeedbackSurface } from '../lib/feedback';

/** A column with a database default is optional on insert. */
type Timestamps = { created_at: string; updated_at: string };

export type Profile = Timestamps & {
  id: string;
  role: Role;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  links: Record<string, string>;
  /** Identity-verified. Set by the verification webhook, never by the member. */
  verified: boolean;
  is_admin: boolean;
  account_status: AccountStatus;
};

export type Listing = Timestamps & {
  id: string;
  owner_id: string;
  name: string;
  tagline: string | null;
  category: Category;
  condition: ListingCondition;
  location: string | null;
  summary: string | null;
  details: string | null;
  website: string | null;
  /** Integer cents, and never null: a thing in a catalogue has a price. */
  price_cents: number;
  currency: string;
  /** Null means not tracked; zero means tracked and sold out. */
  stock_quantity: number | null;
  cover_image_url: string | null;
  status: ListingStatus;
};

/** The three public columns a product page shows about whoever is selling. */
export type ListingSeller = {
  id: string;
  display_name: string;
  verified: boolean;
  location: string | null;
};

/**
 * An enquiry thread. One per (listing, buyer) — a second question about the
 * same item belongs in the thread the first answer is in.
 */
export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  /** Set from the listing by a trigger, never trusted from the client. */
  seller_id: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Block = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  subject_profile_id: string | null;
  subject_listing_id: string | null;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

// --- applications -----------------------------------------------------------

/** Columns every application table shares. The review columns are trigger-guarded. */
type ApplicationBase = Timestamps & {
  id: string;
  profile_id: string;
  contact_name: string;
  contact_email: string;
  website: string | null;
  motivation: string;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

export type SellerApplication = ApplicationBase & {
  shop_name: string;
  seller_type: SellerType;
  categories: Category[];
  fulfilment_note: string | null;
};

export type AdvertiserApplication = ApplicationBase & {
  company_name: string;
  placements: AdPlacement[];
};

export type PromoterApplication = ApplicationBase & {
  promoter_type: PromoterType;
  platforms: PromoterPlatform[];
  audience_size: number | null;
  estimated_monthly_referrals: EstimatedMonthlyReferrals;
};

/** Which table a row lives in. Applications are one workflow over three tables. */
export type ApplicationKind = 'seller' | 'advertiser' | 'promoter';

export type ApplicationMessage = {
  id: string;
  application_kind: ApplicationKind;
  application_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

/** Reviewer-only notes. Never visible to the applicant — see the RLS policy. */
export type ApplicationNote = {
  id: string;
  application_kind: ApplicationKind;
  application_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

// --- advertising ------------------------------------------------------------

export type Advertiser = Timestamps & {
  profile_id: string;
  company_name: string;
  blurb: string;
  website: string;
  logo_url: string | null;
  /** Listed in the public directory. An administrator decides. */
  listed: boolean;
};

export type AdCampaign = Timestamps & {
  id: string;
  advertiser_id: string;
  placement: AdPlacement;
  headline: string;
  body: string;
  destination_url: string;
  image_url: string | null;
  starts_on: string;
  ends_on: string;
  budget_cents: number;
  status: CampaignStatus;
  approved_by: string | null;
  approved_at: string | null;
};

/**
 * One row per impression or click.
 *
 * `viewer_id` is deliberately nullable and deliberately not indexed with the
 * campaign: an advertiser reads counts, never rows, and the RLS policy gives
 * them no way to read a viewer id at all.
 */
export type AdEvent = {
  id: string;
  campaign_id: string;
  kind: AdEventKind;
  viewer_id: string | null;
  created_at: string;
};

// --- membership and billing -------------------------------------------------

export type Membership = Timestamps & {
  profile_id: string;
  plan: Plan;
  state: MembershipState;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  processor_customer_id: string | null;
  processor_subscription_id: string | null;
  crm_synced_at: string | null;
  crm_sync_error: string | null;
};

/**
 * Every processor event we have already acted on.
 *
 * The unique index on `event_id` is the idempotency guarantee: a webhook
 * replayed by the processor — which they do, by design — cannot grant a reward
 * or qualify a referral twice.
 */
export type BillingEvent = {
  id: string;
  event_id: string;
  kind: string;
  profile_id: string | null;
  payload: unknown;
  processed_at: string | null;
  error: string | null;
  created_at: string;
};

// --- referrals --------------------------------------------------------------

export type ReferralCode = {
  id: string;
  profile_id: string;
  code: string;
  created_at: string;
};

export type Referral = {
  id: string;
  code_id: string;
  /** The promoter or member who owns the code. Denormalised for the payout query. */
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus;
  /** Snapshotted when the referral is created, so a rate change is never retroactive. */
  fee_cents: number;
  qualified_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type PromoterAccount = Timestamps & {
  profile_id: string;
  agreement_accepted_at: string | null;
  payment_confirmed_at: string | null;
  /** Active means: approved, agreement signed, payment set up. */
  active: boolean;
};

// --- notifications ----------------------------------------------------------

export type Notification = {
  id: string;
  profile_id: string;
  kind: string;
  payload: unknown;
  read_at: string | null;
  created_at: string;
};

export type NotificationPreferences = {
  profile_id: string;
  email_activity: boolean;
  email_messages: boolean;
  email_account: boolean;
  email_marketing: boolean;
  push_activity: boolean;
  push_messages: boolean;
  updated_at: string;
};

/**
 * The outbox.
 *
 * A row is written by a trigger, claimed by a worker, and marked done. The
 * claim is what makes delivery at-least-once without being at-least-twice in
 * practice — see `claim_notification_delivery()`.
 */
export type NotificationDelivery = {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  claimed_at: string | null;
  delivered_at: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
};

export type PushToken = {
  id: string;
  profile_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
};

// --- onboarding, identity, feedback, audit ----------------------------------

export type OnboardingCompletion = Timestamps & {
  id: string;
  profile_id: string;
  role: 'seller' | 'buyer' | 'advertiser' | 'promoter';
  last_step: number;
  dismissed: boolean;
  completed_at: string | null;
};

export type IdentityVerification = Timestamps & {
  id: string;
  profile_id: string;
  status: VerificationStatus;
  /** The processor's session id. No document, image or number is ever stored. */
  session_id: string | null;
  failure_reason: string | null;
  verified_at: string | null;
};

export type FeatureFeedback = Timestamps & {
  id: string;
  profile_id: string;
  surface: FeedbackSurface;
  category: FeedbackCategory;
  impact: FeedbackImpact;
  title: string;
  body: string;
  pathname: string | null;
  status: FeedbackStatus;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
};

export type AdminAuditLog = {
  id: string;
  actor_id: string;
  action: string;
  subject_table: string;
  subject_id: string | null;
  detail: unknown;
  created_at: string;
};

// ---------------------------------------------------------------------------
// the Database generic
// ---------------------------------------------------------------------------

/**
 * What an insert may leave out.
 *
 * Two groups. Nullable columns are inferred: a column that accepts null has a
 * null default, so requiring it on insert would be a lie the compiler tells.
 * Everything else is spelled out per table below, because `Partial<Row>` would
 * make *every* column optional and lose the compile error you want when an
 * insert forgets `owner_id`.
 */
type NullableKeys<T> = { [K in keyof T]-?: null extends T[K] ? K : never }[keyof T];

type Insert<Row, Optional extends keyof Row> = Omit<Row, Optional | NullableKeys<Row>> &
  Partial<Pick<Row, Optional | NullableKeys<Row>>>;

type Defaults = 'id' | 'created_at' | 'updated_at';

type Table<Row, OptionalOnInsert extends keyof Row = never> = {
  Row: Row;
  Insert: Insert<Row, Extract<Defaults, keyof Row> | OptionalOnInsert>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, 'role' | 'verified' | 'is_admin' | 'account_status' | 'links'>;
      listings: Table<Listing, 'status' | 'condition' | 'currency'>;
      conversations: Table<Conversation, 'buyer_last_read_at' | 'seller_last_read_at'>;
      messages: Table<Message>;
      blocks: Table<Block>;
      reports: Table<Report, 'status' | 'resolved_by' | 'resolved_at'>;
      seller_applications: Table<
        SellerApplication,
        'status' | 'reviewed_by' | 'reviewed_at' | 'review_note'
      >;
      advertiser_applications: Table<
        AdvertiserApplication,
        'status' | 'reviewed_by' | 'reviewed_at' | 'review_note'
      >;
      promoter_applications: Table<
        PromoterApplication,
        'status' | 'reviewed_by' | 'reviewed_at' | 'review_note'
      >;
      application_messages: Table<ApplicationMessage>;
      application_notes: Table<ApplicationNote>;
      advertisers: Table<Advertiser, 'listed'>;
      ad_campaigns: Table<AdCampaign, 'status' | 'approved_by' | 'approved_at'>;
      ad_events: Table<AdEvent, 'viewer_id'>;
      memberships: Table<Membership, 'plan' | 'state' | 'cancel_at_period_end'>;
      billing_events: Table<BillingEvent, 'processed_at' | 'error' | 'profile_id'>;
      referral_codes: Table<ReferralCode>;
      referrals: Table<Referral, 'status' | 'qualified_at' | 'paid_at'>;
      promoter_accounts: Table<PromoterAccount, 'active'>;
      notifications: Table<Notification, 'read_at'>;
      notification_preferences: Table<
        NotificationPreferences,
        | 'updated_at'
        | 'email_activity'
        | 'email_messages'
        | 'email_account'
        | 'email_marketing'
        | 'push_activity'
        | 'push_messages'
      >;
      notification_deliveries: Table<
        NotificationDelivery,
        'claimed_at' | 'delivered_at' | 'error' | 'attempts'
      >;
      push_tokens: Table<PushToken>;
      onboarding_completions: Table<
        OnboardingCompletion,
        'last_step' | 'dismissed' | 'completed_at'
      >;
      identity_verifications: Table<
        IdentityVerification,
        'status' | 'session_id' | 'failure_reason' | 'verified_at'
      >;
      feature_feedback: Table<
        FeatureFeedback,
        'status' | 'response' | 'responded_by' | 'responded_at' | 'pathname'
      >;
      admin_audit_log: Table<AdminAuditLog, 'detail' | 'subject_id'>;
    };
    Views: Record<string, never>;
    Functions: {
      /** The catalogue: filtered, sorted, paged. Public — `anon` may call it. */
      search_catalogue: {
        Args: {
          p_query?: string | null;
          p_category?: string | null;
          p_condition?: string | null;
          p_min_cents?: number | null;
          p_max_cents?: number | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Listing[];
      };
      /** How many rows the same filters match, for the pager. */
      count_catalogue: {
        Args: {
          p_query?: string | null;
          p_category?: string | null;
          p_condition?: string | null;
          p_min_cents?: number | null;
          p_max_cents?: number | null;
        };
        Returns: number;
      };
      /** The seller behind a listing, for a product page a stranger can open. */
      listing_seller: { Args: { p_listing_id: string }; Returns: ListingSeller[] };
      /** Open an enquiry, or add to the one that already exists. */
      start_enquiry: { Args: { p_listing_id: string; p_body: string }; Returns: string };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: void };
      review_application: {
        Args: {
          p_kind: ApplicationKind;
          p_application_id: string;
          p_status: ApplicationStatus;
          p_note: string | null;
        };
        Returns: void;
      };
      ensure_my_referral_code: { Args: Record<string, never>; Returns: string };
      attribute_signup: { Args: { p_code: string }; Returns: boolean };
      mark_referrals_paid: { Args: { p_referral_ids: string[] }; Returns: number };
      has_active_membership: { Args: { p_profile_id?: string }; Returns: boolean };
      intro_seats_remaining: { Args: Record<string, never>; Returns: number };
      admin_search_accounts: {
        Args: { p_query: string; p_limit?: number };
        Returns: Profile[];
      };
      admin_set_role: { Args: { p_profile_id: string; p_role: Role }; Returns: void };
      admin_set_account_status: {
        Args: { p_profile_id: string; p_status: AccountStatus };
        Returns: void;
      };
      record_ad_event: {
        Args: { p_campaign_id: string; p_kind: AdEventKind };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
