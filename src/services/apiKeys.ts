/**
 * API Key resolution for Expo React Native
 * 
 * DEBUG RESULT: process.env is empty in production bundle.
 * Constants.expoConfig.extra IS populated via app.config.js ✅
 * → Prioritize Constants.extra over process.env
 */
import Constants from 'expo-constants';

function resolveKey(envName: string, extraName: string): string {
  // Source 1 (WORKING): Constants.expoConfig.extra via app.config.js
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  const fromExtra = extra?.[extraName];
  if (fromExtra && fromExtra.length > 10) return fromExtra;

  // Source 2: legacy manifest (Expo Go / older SDK)
  const legacyExtra = (Constants as any).manifest?.extra as Record<string, string> | undefined;
  const fromLegacy = legacyExtra?.[extraName];
  if (fromLegacy && fromLegacy.length > 10) return fromLegacy;

  // Source 3: process.env (only works in dev/Expo Go, not production APK)
  const fromEnv = (process.env as any)[envName] as string | undefined;
  if (fromEnv && fromEnv.length > 10) return fromEnv;

  return '';
}

export function getGeminiKey(): string {
  return resolveKey('EXPO_PUBLIC_GEMINI_API_KEY', 'geminiApiKey');
}

export function getOpenRouterKey(): string {
  return resolveKey('EXPO_PUBLIC_OPENROUTER_API_KEY', 'openRouterApiKey');
}

export function getApiDebugInfo(): string {
  const gemini = getGeminiKey();
  const openRouter = getOpenRouterKey();
  const extra = Constants.expoConfig?.extra as any;

  return [
    `Gemini: ${gemini.length > 10 ? '✅ ' + gemini.slice(0, 8) + '...' : '❌ MISSING'}`,
    `OpenRouter: ${openRouter.length > 10 ? '✅ ' + openRouter.slice(0, 8) + '...' : '❌ MISSING'}`,
    `Constants.extra geminiApiKey: ${extra?.geminiApiKey ? extra.geminiApiKey.slice(0, 8) + '...' : 'empty'}`,
    `process.env: ${(process.env as any)['EXPO_PUBLIC_GEMINI_API_KEY'] ? 'present' : 'empty'}`,
  ].join('\n');
}

export function getApiStatus(): { gemini: boolean; openRouter: boolean } {
  return {
    gemini: getGeminiKey().length > 10,
    openRouter: getOpenRouterKey().length > 10,
  };
}
