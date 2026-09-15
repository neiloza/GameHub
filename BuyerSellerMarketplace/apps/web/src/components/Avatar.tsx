/**
 * Profile pictures and business logos.
 *
 * One component for both because they are the same problem: a stored image that
 * is usually missing, next to a name that always exists. When there is no
 * image, initials on a colour derived from the name give a stable, recognisable
 * placeholder — the same person or business gets the same tile every time,
 * without a request or a random palette.
 *
 * Plain <img> rather than next/image: these URLs come from a Supabase Storage
 * bucket whose host is per-project and set at runtime, which the image
 * optimiser's remote allowlist cannot express.
 */

const SIZES = {
  xs: { box: 'h-6 w-6', text: 'text-[10px]' },
  sm: { box: 'h-8 w-8', text: 'text-xs' },
  md: { box: 'h-12 w-12', text: 'text-sm' },
  lg: { box: 'h-16 w-16', text: 'text-lg' },
  xl: { box: 'h-24 w-24', text: 'text-2xl' },
} as const;

export type AvatarSize = keyof typeof SIZES;

/** Brand tones only — a placeholder should still look like part of the app. */
const TONES = [
  'bg-ink text-white',
  'bg-brand-dark text-white',
  'bg-brand text-white',
  'bg-accent text-white',
  'bg-surface text-brand-dark',
];

/**
 * First letter of the first two words, so "Salt-Safe Foods" reads SF and
 * "Chris" reads C. Falls back to a bullet rather than rendering an empty tile.
 *
 * The `name` parameter is typed as a string, but this renders rows fetched at
 * runtime and a missing column arrives as `undefined` regardless of what the
 * type says — which used to take the whole page down with "name is not
 * iterable". A tile is decoration; it does not get to crash a page.
 */
export function initialsFor(name: string | null | undefined): string {
  const parts = (name ?? '')
    .split(/[\s\-_/]+/)
    .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (parts.length === 0) return '•';
  return parts
    .slice(0, 2)
    .map((p) => [...p][0]!.toUpperCase())
    .join('');
}

/** Stable per name: the same business always lands on the same tone. */
function toneFor(name: string | null | undefined): string {
  let hash = 0;
  for (const ch of name ?? '') hash = (hash * 31 + ch.codePointAt(0)!) % 100000;
  return TONES[hash % TONES.length]!;
}

export function Avatar({
  src,
  name,
  size = 'md',
  shape = 'circle',
  fallback,
  className = '',
}: {
  src?: string | null;
  /** Used for the alt text, the initials, and the placeholder colour. */
  name: string | null | undefined;
  size?: AvatarSize;
  /** People are circles, businesses are squircles — it reads at a glance. */
  shape?: 'circle' | 'rounded';
  /** Shown instead of initials when there is no image (an industry emoji). */
  fallback?: string;
  className?: string;
}) {
  const { box, text } = SIZES[size];
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
  const frame = `${box} ${radius} shrink-0 overflow-hidden ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        loading="lazy"
        decoding="async"
        className={`${frame} border border-slate-200 bg-white object-cover`}
      />
    );
  }

  return (
    <span
      // The name is already adjacent wherever this renders, so the tile itself
      // is decoration and would only be repeated noise to a screen reader.
      aria-hidden
      className={`${frame} ${text} ${toneFor(name)} grid place-items-center font-extrabold leading-none tracking-tight`}
    >
      {fallback ?? initialsFor(name)}
    </span>
  );
}
