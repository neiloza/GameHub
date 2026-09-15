'use client';

import { useEffect, useRef } from 'react';

// Polls /version.json (rewritten on every deploy) and reloads the page when the
// build id changes, so a home-screen PWA that resumes an old session picks up
// new deploys automatically instead of showing stale code.
const POLL_MS = 15_000;

export function AutoUpdater() {
  const baseline = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchVersion(): Promise<string | null> {
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = (await res.json()) as { version?: unknown };
        return typeof data.version === 'string' ? data.version : null;
      } catch {
        return null;
      }
    }

    async function check() {
      const v = await fetchVersion();
      if (!active || !v) return;
      if (baseline.current === null) {
        baseline.current = v; // remember the version this session started on
        return;
      }
      if (v === baseline.current) return;

      // A new deploy is live. Don't yank the page while someone is typing or
      // when the tab is backgrounded — wait for the next check.
      const el = document.activeElement as HTMLElement | null;
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (document.visibilityState === 'visible' && !typing) {
        window.location.reload();
      }
    }

    void check();
    const id = window.setInterval(check, POLL_MS);
    // Re-check the moment the app comes back to the foreground — the common
    // case for a reopened home-screen PWA that resumed an old session.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
