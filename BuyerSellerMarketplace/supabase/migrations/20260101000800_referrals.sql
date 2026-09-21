-- Referrals and the promoter program.
--
-- Two rules this file encodes, both of them things a client could be made to
-- skip and so both enforced here:
--
--   * Attribution is first-write-wins and never moves. A second code on the
--     same account is refused rather than overwriting the first.
--   * The fee is snapshotted when the referral is created. Changing the rate
--     never reprices a referral that already exists.
--
-- Nothing in this file grants or pays anything. A referral qualifies in the
-- billing webhook, against an event already recorded in `billing_events`, so a
-- replayed delivery cannot double-pay.

create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  -- Upper case, checked case-sensitively, normalised on the way in by
  -- ensure_my_referral_code() and by normalizeReferralCode() in the client.
  code text not null unique check (code ~ '^[A-Z0-9]{6,12}$'),
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

create policy "members read their own code"
  on public.referral_codes for select
  to authenticated
  using (profile_id = auth.uid());

create policy "admins read all codes"
  on public.referral_codes for select
  to authenticated
  using (public.is_admin());

-- No INSERT policy: ensure_my_referral_code() mints them, so a member cannot
-- choose their own code and cannot mint one for somebody else.

/**
 * Mint (or fetch) the caller's referral code. Idempotent.
 *
 * The retry loop exists because the code is random and unique: a collision is
 * vanishingly unlikely and entirely possible, and the alternative — deriving
 * the code from the profile id — would leak the id into a link people paste in
 * public.
 */
create or replace function public.ensure_my_referral_code()
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  select code into v_code from public.referral_codes where profile_id = auth.uid();
  if v_code is not null then
    return v_code;
  end if;

  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  loop
    v_attempt := v_attempt + 1;
    -- 8 characters from a 36-symbol alphabet. Ambiguous glyphs are left in:
    -- codes are copied from a link, not read down a phone.
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    begin
      insert into public.referral_codes (profile_id, code) values (auth.uid(), v_code);
      return v_code;
    exception
      when unique_violation then
        -- Somebody else holds that code, or this profile got one concurrently.
        select code into v_code from public.referral_codes where profile_id = auth.uid();
        if v_code is not null then
          return v_code;
        end if;
        if v_attempt >= 5 then
          raise;
        end if;
    end;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- referrals
-- ---------------------------------------------------------------------------

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.referral_codes (id) on delete cascade,
  -- Denormalised from code_id so the payout query does not join on every row.
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  -- One referral per referred account, for ever. This unique constraint is what
  -- "attribution never moves" means in practice.
  referred_id uuid not null unique references public.profiles (id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'paid', 'disqualified')),
  -- Snapshotted at creation. A later rate change never reprices this row.
  fee_cents bigint not null check (fee_cents >= 0),

  qualified_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),

  check (referrer_id <> referred_id)
);

create index referrals_referrer_status_idx on public.referrals (referrer_id, status);

alter table public.referrals enable row level security;

create policy "referrers read their own referrals"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid());

create policy "admins read all referrals"
  on public.referrals for select
  to authenticated
  using (public.is_admin());

-- No write policy. attribute_signup() creates rows; the billing webhook
-- qualifies them; mark_referrals_paid() settles them.

/**
 * Attach a referral code to the signed-in account.
 *
 * Returns true when this call created the attribution, false when there was
 * nothing to do — already attributed, unknown code, or the member's own code.
 * The three false cases are deliberately indistinguishable to the caller: a
 * function that said "that code does not exist" would let anybody enumerate
 * which codes do.
 */
create or replace function public.attribute_signup(p_code text)
returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  v_code public.referral_codes;
begin
  if auth.uid() is null then
    return false;
  end if;

  -- Already attributed. First write wins, for ever.
  if exists (select 1 from public.referrals where referred_id = auth.uid()) then
    return false;
  end if;

  select * into v_code from public.referral_codes
   where code = upper(btrim(p_code));
  if not found then
    return false;
  end if;

  -- A code cannot be applied to its owner's own account.
  if v_code.profile_id = auth.uid() then
    return false;
  end if;

  insert into public.referrals (code_id, referrer_id, referred_id, fee_cents)
  values (v_code.id, v_code.profile_id, auth.uid(), 2500)
  on conflict (referred_id) do nothing;

  return found;
end;
$$;

/**
 * Settle a payout run.
 *
 * Only moves `qualified` rows, so calling it twice with the same ids pays once:
 * the second call matches nothing. Returns how many rows actually moved, which
 * is what the administrator should reconcile against the money they sent.
 */
create or replace function public.mark_referrals_paid(p_referral_ids uuid[])
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'only an administrator may settle a payout';
  end if;

  update public.referrals
     set status = 'paid', paid_at = now()
   where id = any (p_referral_ids)
     and status = 'qualified';

  get diagnostics v_count = row_count;

  insert into public.admin_audit_log (actor_id, action, subject_table, detail)
  values (
    auth.uid(), 'mark_referrals_paid', 'referrals',
    jsonb_build_object('count', v_count, 'ids', to_jsonb(p_referral_ids))
  );

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- promoter accounts
-- ---------------------------------------------------------------------------

/**
 * The state between "approved" and "earning".
 *
 * An approved promoter is not yet an active one: they have to accept the
 * agreement, and an administrator has to confirm that payment has been arranged
 * — which happens off this platform, because we never ask for and never store
 * banking details. `active` is a generated column so those two facts cannot
 * disagree with the flag that reads them.
 */
create table public.promoter_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  agreement_accepted_at timestamptz,
  payment_confirmed_at timestamptz,
  active boolean generated always as (
    agreement_accepted_at is not null and payment_confirmed_at is not null
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger promoter_accounts_updated_at
  before update on public.promoter_accounts
  for each row execute function public.set_updated_at();

/**
 * A promoter signs their own agreement; only an administrator confirms payment.
 *
 * Both columns are write-once: un-signing an agreement you have already acted
 * under is not a thing, and a confirmation that can be toggled is not a
 * confirmation.
 */
create or replace function public.protect_promoter_account()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.payment_confirmed_at is distinct from old.payment_confirmed_at then
    raise exception 'only an administrator may confirm payment setup';
  end if;

  if old.agreement_accepted_at is not null
     and new.agreement_accepted_at is distinct from old.agreement_accepted_at then
    raise exception 'the agreement has already been accepted';
  end if;

  return new;
end;
$$;

create trigger promoter_accounts_protect
  before update on public.promoter_accounts
  for each row execute function public.protect_promoter_account();

alter table public.promoter_accounts enable row level security;

create policy "promoters read their own account"
  on public.promoter_accounts for select
  to authenticated
  using (profile_id = auth.uid());

create policy "promoters accept their own agreement"
  on public.promoter_accounts for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "admins read all promoter accounts"
  on public.promoter_accounts for select
  to authenticated
  using (public.is_admin());

create policy "admins update promoter accounts"
  on public.promoter_accounts for update
  to authenticated
  using (public.is_admin())
  with check (true);

/**
 * Approving a promoter application opens their account.
 *
 * A trigger rather than a branch inside review_application(), so the two
 * migrations stay independent: this file knows about promoter accounts and the
 * applications file does not need to.
 */
create or replace function public.open_promoter_account()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.promoter_accounts (profile_id)
    values (new.profile_id)
    on conflict (profile_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger promoter_applications_open_account
  after update on public.promoter_applications
  for each row execute function public.open_promoter_account();
