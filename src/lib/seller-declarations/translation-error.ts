// Do not expose upstream messages: authentication errors can contain part of a secret key.
export function translationError(status: number, body: unknown): string {
  const error = body && typeof body === "object" && "error" in body ? body.error : null;
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
  const type = error && typeof error === "object" && "type" in error && typeof error.type === "string" ? error.type : "";
  const billingCodes = ["insufficient_quota", "billing_hard_limit_reached", "billing_not_active", "organization_usage_limit_exceeded", "project_spend_limit_exceeded"];
  let message: string;
  if (billingCodes.includes(code) || type === "insufficient_quota") {
    message = "OpenAI reports a credit, billing, or spending-limit problem. Check API billing and limits for the organization/project that owns this key.";
  } else if (code === "model_not_found") {
    message = "The translation model is unavailable to this API project. Check the project's model access and SELLER_DECLARATIONS_TRANSLATION_MODEL setting.";
  } else if (status === 401) {
    message = "OpenAI rejected authentication. Check that OPENAI_API_KEY is correct and active, and that the API project permits this server's IP address.";
  } else if (status === 403) {
    message = "OpenAI denied access. Check the API key's permissions, project model access, and any regional access restrictions.";
  } else if (status === 429) {
    message = "OpenAI limited this request. Wait briefly and retry; if it continues, check API project rate limits and billing.";
  } else if (status >= 500) {
    message = "OpenAI is temporarily unavailable. Please retry later or enter the translation manually.";
  } else {
    message = "OpenAI rejected the translation request. Share the HTTP status and error code below so the request can be checked.";
  }
  const safeCode = /^[a-z_]{1,70}$/.test(code) ? ", " + code : "";
  return message + " (HTTP " + status + safeCode + ")";
}
