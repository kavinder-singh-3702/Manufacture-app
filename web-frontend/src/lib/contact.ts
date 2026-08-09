/**
 * ARVANN's own contact details — single source of truth, in the same spirit as
 * `SITE_URL` in `./site.ts`. The support email used to be copy-pasted across
 * eight files (two of which declared their own private `SUPPORT_EMAIL` const),
 * which is exactly how a stale address survives a rebrand: `support@manufacture.run`
 * lived on in the footer long after it stopped being a mailbox ARVANN owns.
 *
 * These are ARVANN's *own* business details, not third-party seller PII, so
 * they are rendered publicly and unmasked — logged-out visitors and crawlers
 * both see them, which is what makes the `telephone`/`contactPoint` in the
 * Organization JSON-LD (see `features/marketing/server/schema.ts`) legitimate.
 * A third-party seller's phone is a different thing entirely and keeps its
 * masked, auth-gated `RevealPhoneButton` flow.
 */

/** E.164, digits only after the `+` — the form `tel:` and wa.me both want. */
export const SUPPORT_PHONE = "+919306407553";

/** Human-readable form. Use this for anything a person reads. */
export const SUPPORT_PHONE_DISPLAY = "+91 93064 07553";

export const SUPPORT_PHONE_TEL = `tel:${SUPPORT_PHONE}`;

/**
 * `https://wa.me/…` rather than `whatsapp://` so the link degrades to WhatsApp
 * Web on desktop instead of dead-ending when the native app isn't installed.
 */
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, "")}`;

export const SUPPORT_EMAIL = "arvann100@gmail.com";

export const SUPPORT_EMAIL_MAILTO = `mailto:${SUPPORT_EMAIL}`;
