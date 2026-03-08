/**
 * Expo dynamic config
 * Reads API keys from environment at EAS build time
 * Keys come from .env file written by GitHub Actions workflow
 */
module.exports = ({ config }) => {
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const openRouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

  // Log at build time so we can verify in EAS logs
  console.log('[app.config.js] GEMINI key present:', geminiKey.length > 10 ? `YES (${geminiKey.slice(0,8)}...)` : 'NO ❌');
  console.log('[app.config.js] OPENROUTER key present:', openRouterKey.length > 10 ? `YES (${openRouterKey.slice(0,8)}...)` : 'NO');

  return {
    ...config,
    extra: {
      ...config.extra,
      geminiApiKey: geminiKey,
      openRouterApiKey: openRouterKey,
    },
  };
};
