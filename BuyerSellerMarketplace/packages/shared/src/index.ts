export * from './constants';
export * from './types/database';
export * from './schemas';

// Pure logic — no client, no React, unit-tested.
export * from './lib/access';
export * from './lib/feedback';
export * from './lib/matching';
export * from './lib/membership';
export * from './lib/notifications';
export * from './lib/onboarding';
export * from './lib/redirect';
export * from './lib/referrals';
export * from './lib/selection';
export * from './lib/website';

// Data access — every function takes the typed client as its first argument.
export * from './api/client';
export * from './api/admin';
export * from './api/advertising';
export * from './api/applications';
export * from './api/billing';
export * from './api/chat';
export * from './api/discovery';
export * from './api/feedback';
export * from './api/identity';
export * from './api/listings';
export * from './api/media';
export * from './api/notifications';
export * from './api/onboarding';
export * from './api/profiles';
export * from './api/promoter';

// React hooks — client components only.
export * from './hooks/useMembership';
export * from './hooks/useMessages';
export * from './hooks/useNotifications';
