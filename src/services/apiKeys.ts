/**
 * API Key resolution for Expo React Native
 * 
 * EXPO_PUBLIC_ vars are baked into the JS bundle at EAS build time.
 * They come from .env file written by the GitHub Actions workflow.
 * Constants.expoConfig.extra is a secondary fallback via app.config.js.
 */
import Constants from 'expo-constants';

function resolveKey(envName: string, extraName: string): string {
  // Source 1: process.env (EXPO_PUBLIC_ vars baked into bundle at build time)
  const fromEnv = (process.env as any)[envName] as string | undefined;
  if (fromEnv && fromEnv.length > 10) return fromEnv;

  // Source 2: Constants.expoConfig.extra (set via app.config.js)
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const fromExtra = extra?.[extraName];
  if (fromExtra && fromExtra.length > 10) return fromExtra;

  // Source 3: legacy manifest (Expo Go / older SDK)
  const legacyExtra = (Constants as any).manifest?.extra as Record<string, string> | undefined;
  const fromLegacy = legacyExtra?.[extraName];
  if (fromLegacy && fromLegacy.length > 10) return fromLegacy;

  return '';
}

export function getGeminiKey(): string {
  return resolveKey('EXPO_PUBLIC_GEMINI_API_KEY', 'geminiApiKey');
}

export function getOpenRouterKey(): string {
  return resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey');
}

/** Returns a debug report of what keys are available */
export function getApiDebugInfo(): string {
  const gemini = getGeminiKey();
  const openRouter = getOpenRouterKey();
  const envGemini = (process.env as any)['EXPO_PUBLIC_GEMINI_API_KEY'] || '';
  const extraGemini = (Constants.expoConfig?.extra as any)?.geminiApiKey || '';

  return [
    `Gemini: ${gemini.length > 10 ? '✅ ' + gemini.slice(0,8) + '...' : '❌ MISSING'}`,
    `OpenRouter: ${openRouter.length > 10 ? '✅ ' + openRouter.slice(0,8) + '...' : '❌ MISSING'}`,
    `[src] process.env: ${envGemini.length > 0 ? envGemini.slice(0,8) + '...' : 'empty'}`,
    `[src] Constants.extra: ${extraGemini.length > 0 ? extraGemini.slice(0,8) + '...' : 'empty'}`,
  ].join('\n');
}

export function getApiStatus(): { gemini: boolean; openRouter: boolean } {
  return {
    gemini: getGeminiKey().length > 10,
    openRouter: getOpenRouterKey().length > 10,
  };
}
