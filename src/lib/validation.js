/** Simple form-validation helpers for Server Actions. */

export function text(formData, name) {
  return String(formData.get(name) ?? "").trim();
}

export function int(formData, name) {
  const n = Number(formData.get(name));
  return Number.isInteger(n) ? n : NaN;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => v === "" || /^[0-9+\-\s]{7,15}$/.test(v);

/** Returns the first error message, or null if everything is valid. */
export function firstError(checks) {
  for (const [ok, message] of checks) if (!ok) return message;
  return null;
}

export const fail = (error) => ({ ok: false, error });
export const success = (message) => ({ ok: true, message });
