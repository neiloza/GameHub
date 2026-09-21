/*
 * Outbound email — password resets only.
 *
 * Sent over Resend's HTTP API with plain fetch rather than an SDK or SMTP: one
 * fewer dependency on a service that holds who paid you, and HTTP is easier to
 * debug than SMTP when a message does not arrive. Swapping provider means
 * changing `deliver()` and nothing else.
 *
 * THE FAILURE THAT MATTERS IS NOT AN ERROR. A reset that lands in spam is
 * indistinguishable, from the user's side, from one that was never sent — and
 * you will not reproduce it, because your own mail arrives. SPF and DKIM on
 * the sending domain are not optional; see SETUP.md step 8.
 */

const FROM = process.env.MAIL_FROM ?? "The Wizard of Oza <no-reply@thewizardofoza.com>";
const RESEND_KEY = process.env.RESEND_API_KEY;

async function deliver({ to, subject, text }) {
  if (!RESEND_KEY) {
    // In development, print it. Silently doing nothing would mean a reset flow
    // that appears to work and never arrives — which is the exact bug this
    // file exists to avoid.
    console.log(`\n--- email (no RESEND_API_KEY, not sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${text}\n---\n`);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, text }),
    });
    if (!res.ok) {
      throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The reset email — and the one that says there is nothing to reset.
 *
 * A Google-only account has no password. Saying that on the FORM would be an
 * account-enumeration oracle, so it is said HERE, in a message only the
 * account holder can read. Without this branch, somebody who signed up with
 * Google and forgot that fact asks for a reset, receives nothing at all, and
 * concludes the app is broken.
 */
export async function sendPasswordReset(to, link, { googleOnly = false } = {}) {
  if (googleOnly) {
    return deliver({
      to,
      subject: "Signing in to The Wizard of Oza",
      text: [
        "Somebody asked to reset the password for this address.",
        "",
        "This account does not have a password — it signs in with Google.",
        'Go back to the app and choose "Continue with Google".',
        "",
        "If that was not you, you can ignore this. Nothing has changed.",
      ].join("\n"),
    });
  }

  return deliver({
    to,
    subject: "Reset your password",
    text: [
      "Somebody asked to reset the password for this address.",
      "",
      "Choose a new password here:",
      link,
      "",
      "The link works once and expires in an hour.",
      "",
      "If that was not you, you can ignore this. Your password has not changed,",
      "and the link above will expire on its own.",
    ].join("\n"),
  });
}
