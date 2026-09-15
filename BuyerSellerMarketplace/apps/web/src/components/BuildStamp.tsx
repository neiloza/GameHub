'use client';

import { useEffect, useState } from 'react';

// Inlined at build time from public/version.json (see next.config.ts), so this
// paints immediately instead of waiting on a fetch the way AutoUpdater does.
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? '';
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? '';

function formatUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function formatLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/**
 * When this build of the app was deployed. Shown at the bottom of the home
 * screen so it's obvious which version is running.
 */
export function BuildStamp() {
  // Date formatting depends on the viewer's timezone, so formatting during
  // render would desync hydration. Serve the stable UTC string, then upgrade to
  // local time once mounted.
  const [label, setLabel] = useState(() => formatUtc(BUILD_TIME));

  useEffect(() => {
    if (BUILD_TIME) setLabel(formatLocal(BUILD_TIME));
  }, []);

  if (!label) return null;

  // A <span>, not a <p>: this sits inline beside the copyright in the footer,
  // and a <p> inside a <p> is invalid HTML — the browser closes the outer one
  // early, which desyncs hydration.
  return (
    <span className="shrink-0 text-[11px] leading-tight text-slate-400">
      Updated <time dateTime={BUILD_TIME}>{label}</time>
      {BUILD_ID && <span className="hidden sm:inline"> · {BUILD_ID}</span>}
    </span>
  );
}
