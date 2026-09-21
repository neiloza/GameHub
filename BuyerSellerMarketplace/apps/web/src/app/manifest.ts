import type { MetadataRoute } from 'next';

/**
 * Served at /manifest.webmanifest and auto-linked from <head>.
 *
 * This is what makes "Add to Home Screen" produce an app rather than a
 * bookmark: `display: standalone` drops the browser chrome, and the theme and
 * background colours are what the OS paints around and behind the splash while
 * the app boots — get them wrong and every cold start flashes white.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Marketplace',
    short_name: 'Marketplace',
    description: 'A two-sided marketplace: list what you have, find what you want.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f8fa',
    theme_color: '#0b1d35',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // A separate maskable icon, with the mark inside the safe zone. Android
        // crops `any` icons to whatever shape the launcher uses, so without
        // this the edges of the logo get shaved off.
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
