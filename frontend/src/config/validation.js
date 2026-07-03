export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  const trimmed = value?.trim();
  return !!trimmed && EMAIL_REGEX.test(trimmed);
}

export const emailRules = [
  (value) => !!value?.trim() || "Email is required.",
  (value) => isValidEmail(value) || "Enter a valid email address.",
];
