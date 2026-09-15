// Emits public/version.json with a per-deploy build id. The client polls this
// file and reloads when it changes (see components/AutoUpdater.tsx). Runs
// before every build (see the build / pages:build scripts).
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

function resolveVersion() {
  // Cloudflare Pages and GitHub Actions both expose the commit SHA.
  const fromEnv = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
}

const version = resolveVersion();
mkdirSync(publicDir, { recursive: true });
writeFileSync(
  join(publicDir, 'version.json'),
  JSON.stringify({ version, builtAt: new Date().toISOString() }) + '\n'
);
console.log(`wrote public/version.json (version=${version})`);
