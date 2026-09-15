import { describe, expect, it } from 'vitest';
import { feedbackSurfaceFor, isQuietForFeedback, showsFeedbackButton } from './feedback';

describe('feedbackSurfaceFor', () => {
  it('files a suggestion by the route, not by the role', () => {
    // A `both` account on a buyer route is talking about the buyer side, even
    // though their profile lists seller first.
    expect(feedbackSurfaceFor('both', '/buyer/discover')).toBe('buyer');
    expect(feedbackSurfaceFor('both', '/listings')).toBe('seller');
  });

  it('refuses a buyer route to somebody with no buyer side', () => {
    expect(feedbackSurfaceFor('seller', '/buyer/discover')).toBeNull();
  });

  it('matches the portal prefix exactly or as a parent, not as a substring', () => {
    expect(feedbackSurfaceFor('buyer', '/buyer')).toBe('buyer');
    expect(feedbackSurfaceFor('buyer', '/buyer/messages/1')).toBe('buyer');
    // `/buyers-guide` is a seller-side page that happens to share a prefix.
    expect(feedbackSurfaceFor('seller', '/buyers-guide')).toBe('seller');
  });

  it('gives advertisers and promoters no surface — the insert policy would refuse it', () => {
    expect(feedbackSurfaceFor('advertiser', '/advertiser')).toBeNull();
    expect(feedbackSurfaceFor('promoter', '/promoter')).toBeNull();
  });

  it('has no surface for a signed-out visitor', () => {
    expect(feedbackSurfaceFor(null, '/listings')).toBeNull();
    expect(feedbackSurfaceFor(undefined, '/listings')).toBeNull();
  });
});

describe('isQuietForFeedback', () => {
  it('stays out of the way where the button would be an interruption', () => {
    for (const path of [
      '/',
      '/auth/sign-in',
      '/onboarding',
      '/apply/buyer',
      '/verify-identity',
      '/admin/users',
      '/feedback',
    ]) {
      expect(isQuietForFeedback(path)).toBe(true);
    }
  });

  it('is happy on the working surfaces', () => {
    for (const path of ['/listings', '/buyer/discover', '/settings', '/directory']) {
      expect(isQuietForFeedback(path)).toBe(false);
    }
  });
});

describe('showsFeedbackButton', () => {
  it('needs both a surface to speak from and a route worth speaking on', () => {
    expect(showsFeedbackButton('seller', '/listings')).toBe(true);
    expect(showsFeedbackButton('seller', '/admin')).toBe(false);
    expect(showsFeedbackButton('advertiser', '/advertiser')).toBe(false);
    expect(showsFeedbackButton(null, '/listings')).toBe(false);
  });
});
