/**
 * Scopes an API key can be granted. Kept free of server-only imports so the
 * dashboard's key-creation form can import it without pulling in bcrypt.
 * `domains` covers the `/api/v1/domains` admin surface.
 */
export const API_KEY_SCOPES = ["send", "read", "jmap", "domains"] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
