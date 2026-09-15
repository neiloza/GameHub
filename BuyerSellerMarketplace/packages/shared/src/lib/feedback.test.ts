import { describe, expect, it } from 'vitest';
import { feedbackSurfaceFor, isQuietForFeedback, showsFeedbackButton } from './feedback';

describe('feedbackSurfaceFor', () => {
  it('files a suggestion by the route, not by the role', () => {
    // A `both` account in the shop is talking about shopping, even though they
    // also run a shop of their own.
    expect(feedbackSurfaceFor('both', '/shop')).toBe('buyer');
    expect(feedbackSurfaceFor('both', '/listings')).toBe('seller');
  });

  it('refuses a seller route to somebody who does not sell', () => {
    expect(feedbackSurfaceFor('buyer', '/listings')).toBeNull();
  });

  it('matches a seller prefix exactly or as a parent, not as a substring', () => {
    expect(feedbackSurfaceFor('seller', '/listings')).toBe('seller');
    expect(feedbackSurfaceFor('seller', '/listings/1/enquiries')).toBe('seller');
    // `/listings-guide` is a shopper-facing page that happens to share a prefix.
    expect(feedbackSurfaceFor('seller', '/listings-guide')).toBe('buyer');
  });

  it('gives everybody who can buy the buyer surface, since everybody can', () => {
    expect(feedbackSurfaceFor('buyer', '/shop')).toBe('buyer');
    expect(feedbackSurfaceFor('seller', '/shop')).toBe('buyer');
    expect(feedbackSurfaceFor('buyer', '/messages')).toBe('buyer');
  });

  it('gives advertisers and promoters no surface — the insert policy would refuse it', () => {
    expect(feedbackSurfaceFor('advertiser', '/advertiser')).toBeNull();
    expect(feedbackSurfaceFor('promoter', '/promoter')).toBeNull();
    expect(feedbackSurfaceFor('advertiser', '/shop')).toBeNull();
  });

  it('has no surface for a signed-out visitor', () => {
    expect(feedbackSurfaceFor(null, '/shop')).toBeNull();
    expect(feedbackSurfaceFor(undefined, '/shop')).toBeNull();
  });
});

describe('isQuietForFeedback', () => {
  it('stays out of the way where the button would be an interruption', () => {
    for (const path of [
      '/',
      '/auth/sign-in',
      '/onboarding',
      '/apply/seller',
      '/verify-identity',
      '/admin/users',
      '/feedback',
    ]) {
      expect(isQuietForFeedback(path)).toBe(true);
    }
  });

  it('is happy on the working surfaces', () => {
    for (const path of ['/listings', '/shop', '/settings', '/directory']) {
      expect(isQuietForFeedback(path)).toBe(false);
    }
  });
});

describe('showsFeedbackButton', () => {
  it('needs both a surface to speak from and a route worth speaking on', () => {
    expect(showsFeedbackButton('seller', '/listings')).toBe(true);
    expect(showsFeedbackButton('buyer', '/shop')).toBe(true);
    expect(showsFeedbackButton('seller', '/admin')).toBe(false);
    expect(showsFeedbackButton('advertiser', '/advertiser')).toBe(false);
    expect(showsFeedbackButton(null, '/shop')).toBe(false);
  });
});
