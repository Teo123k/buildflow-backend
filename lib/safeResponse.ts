// lib/safeResponse.ts

export type JsonRecord = Record<string, unknown>;

/**
 * Ensure response is always a JSON-serializable object.
 * Mirrors the Python safe_response() function.
 */
export function safeResponse(data: unknown): JsonRecord {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      success: false,
      error: "Invalid response format",
      raw: String(data).slice(0, 500)
    };
  }
  return data as JsonRecord;
}

