import type { MarketplaceClient } from './client';

/**
 * Profile pictures and listing images.
 *
 * Two public buckets — `avatars` keyed by profile id, `listing-images` keyed by
 * listing id. Public read is deliberate: an avatar or listing image is meant to
 * be seen by anyone who can see the row pointing at it, and signed URLs would
 * mean a round trip per image on every list, deck card and message row.
 *
 * Storage enforces the size cap and the MIME allowlist itself, so the checks
 * here are for a useful error message rather than for safety.
 */

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const LISTING_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** Human-readable rejection, or null when the file is acceptable. */
export function validateImage(file: File, allowed: readonly string[]): string | null {
  if (!allowed.includes(file.type)) {
    const names = allowed.map((m) => EXTENSIONS[m]?.toUpperCase() ?? m).join(', ');
    return `That file type is not supported. Use ${names}.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 2 MB.`;
  }
  return null;
}

/**
 * Object names are randomised rather than derived from the upload's filename:
 * a predictable name in a public bucket would let anyone guess the URL of a
 * logo a seller has not published yet, and it also avoids a cached old image
 * being served after a replacement.
 */
function objectName(prefix: string, file: File): string {
  const ext = EXTENSIONS[file.type] ?? 'bin';
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return `${prefix}/${unique}.${ext}`;
}

async function uploadTo(
  client: MarketplaceClient,
  bucket: 'avatars' | 'listing-images',
  prefix: string,
  file: File
): Promise<string> {
  const path = objectName(prefix, file);
  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a profile picture and return its public URL. Writing the URL onto the
 * profile is left to the caller so a failed upload never half-updates a row.
 */
export async function uploadAvatar(client: MarketplaceClient, file: File): Promise<string> {
  const problem = validateImage(file, AVATAR_MIME_TYPES);
  if (problem) throw new Error(problem);

  const { data: auth } = await client.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');

  return uploadTo(client, 'avatars', auth.user.id, file);
}

/**
 * Upload a listing image and return its public URL. Namespaced by listing, not
 * by seller, so `owns_listing()` stays the single authority on who may write
 * listing-scoped data.
 */
export async function uploadListingImage(
  client: MarketplaceClient,
  listingId: string,
  file: File
): Promise<string> {
  const problem = validateImage(file, LISTING_IMAGE_MIME_TYPES);
  if (problem) throw new Error(problem);

  return uploadTo(client, 'listing-images', listingId, file);
}

/**
 * Best-effort cleanup of a replaced image. Failure is swallowed: an orphaned
 * object in a public bucket is harmless, and blocking a profile save on it
 * would be worse.
 */
export async function removeStoredImage(
  client: MarketplaceClient,
  bucket: 'avatars' | 'listing-images',
  publicUrl: string
): Promise<void> {
  const marker = `/${bucket}/`;
  const at = publicUrl.indexOf(marker);
  if (at === -1) return;
  const path = publicUrl.slice(at + marker.length);
  if (!path) return;
  await client.storage
    .from(bucket)
    .remove([path])
    .catch(() => undefined);
}
