import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';

// scripts/write-version.mjs writes public/version.json immediately before
// `next build` (see the build / pages:build scripts), so read it here rather
// than minting a second timestamp that could disagree with the one AutoUpdater
// polls. `next dev` doesn't run that script and a fresh clone won't have the
// file (it's gitignored), so fall back to "now" for local development.
function readBuildMarker(): { version: string; builtAt: string } {
  try {
    const raw = readFileSync(join(process.cwd(), 'public', 'version.json'), 'utf8');
    const parsed = JSON.parse(raw) as { version?: unknown; builtAt?: unknown };
    return {
      version: typeof parsed.version === 'string' ? parsed.version : 'dev',
      builtAt: typeof parsed.builtAt === 'string' ? parsed.builtAt : new Date().toISOString(),
    };
  } catch {
    return { version: 'dev', builtAt: new Date().toISOString() };
  }
}

const marker = readBuildMarker();

const nextConfig: NextConfig = {
  transpilePackages: ['@marketplace/shared'],
  env: {
    NEXT_PUBLIC_BUILD_ID: marker.version,
    NEXT_PUBLIC_BUILD_TIME: marker.builtAt,
  },
};

export default nextConfig;
