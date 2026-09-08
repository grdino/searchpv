export const OFFICE_EMAILS = new Set([
  "gerry@ronmorgan.net",
]);

export function isAuthorizedOfficeEmail(value: unknown) {
  return (
    typeof value === "string" &&
    OFFICE_EMAILS.has(value.trim().toLowerCase())
  );
}

