import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy' };

/**
 * A starting point, not a privacy policy.
 *
 * It describes what this codebase actually does with data, which is the part a
 * lawyer cannot write for you and the part most templates get wrong. Everything
 * in square brackets is yours to fill in, and the whole thing needs review
 * before it goes in front of anybody.
 */
export default function PrivacyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Privacy</h1>

      <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Template.</strong> This describes what the software does. It is not legal advice and
        it is not a finished policy — have it reviewed, and fill in everything in brackets.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">What we hold</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
        <li>Your email address and password, held by our authentication provider.</li>
        <li>The profile you fill in: display name, location, a short bio, an optional website.</li>
        <li>Listings you create, and the messages in conversations you are part of.</li>
        <li>Which listings you have asked a seller about.</li>
        <li>Your membership state and the identifiers our payment processor gives us.</li>
      </ul>

      <h2 className="mt-8 font-bold text-brand-dark">What we deliberately never hold</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
        <li>
          Card numbers. Payment happens on our processor&apos;s own hosted pages and no card detail
          ever reaches our servers.
        </li>
        <li>
          Identity documents. Verification runs at our provider; we keep a session identifier and a
          pass or fail, never an image, a scan or a government number.
        </li>
        <li>Bank details for promoter payouts. Those are arranged outside this platform.</li>
      </ul>

      <h2 className="mt-8 font-bold text-brand-dark">Who else sees it</h2>
      <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
        <li>[Hosting and database provider] — everything above, as our data processor.</li>
        <li>[Payment processor] — your email and your subscription.</li>
        <li>[Identity provider] — whatever you hand them directly during a check.</li>
        <li>[Email provider] — your address and the text of notifications we send you.</li>
      </ul>

      <h2 className="mt-8 font-bold text-brand-dark">Other members</h2>
      <p className="mt-2 text-sm text-slate-700">
        Your display name, location, bio and verified badge are visible to signed-in members, and
        to anybody at all on a listing you have published — a product page is public, and that is
        the point of it. Your email address is never shown to another member.
      </p>

      <h2 className="mt-8 font-bold text-brand-dark">Your choices</h2>
      <p className="mt-2 text-sm text-slate-700">
        You can edit or delete your listings at any time, turn off any category of email, and ask us
        to delete your account — write to [contact address]. Deleting an account removes your
        profile and your listings. Messages you sent stay in the other person&apos;s thread,
        because a conversation is not one person&apos;s to erase.
      </p>

      <p className="mt-8 text-xs text-slate-500">Last updated [date].</p>
    </article>
  );
}
