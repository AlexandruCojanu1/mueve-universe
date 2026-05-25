/**
 * Helpers for deriving a human display name.
 *
 * Sign In with Apple "Hide My Email" never sends a name on subsequent logins,
 * and the relay address (e.g. `nbqf6phxrj@privaterelay.appleid.com`) ends up
 * stored as `users.name`. The credentials provider similarly falls back to the
 * email when no name is set. An email is never a display name, so we treat any
 * `@`-containing value as "no name yet" and prompt the user for a real one.
 */

/** Returns a clean human display name, or null if we only have an email-like value. */
export function cleanDisplayName(name?: string | null): string | null {
  const n = (name ?? "").trim();
  if (!n) return null;
  if (n.includes("@")) return null;
  return n;
}

/** First word of the clean display name, or null. */
export function firstNameOf(name?: string | null): string | null {
  const clean = cleanDisplayName(name);
  if (!clean) return null;
  return clean.split(/\s+/)[0] || null;
}
