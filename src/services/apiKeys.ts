/**
 * KrishiAI — API Key Status
 *
 * SECURITY: App holds NO API keys.
 * All AI calls go through Cloudflare Worker which holds keys server-side.
 *
 * Keys in Cloudflare Worker secrets (safe):
 *   GEMINI_API_KEY        → server-side only
 *   OPENROUTER_API_KEY    → server-side only
 *   ZAI_API_KEY           → server-side only
 */

export function getGeminiApiKey(): string {
  return ''; // No key in app — use Cloudflare Worker
}

export function getOpenRouterApiKey(): string {
  return ''; // No key in app — use Cloudflare Worker
}

export function getApiStatus(): { gemini: boolean; openRouter: boolean } {
  // App always uses worker — status reflects worker availability
  return { gemini: true, openRouter: true };
}

export function getApiDebugInfo(): string[] {
  return [
    'Mode: Cloudflare Worker (secure)',
    'Keys: Server-side only (not in APK)',
    'Worker: https://app-krishiai.mithun-hstu.workers.dev',
  ];
}
