/**
 * Expo dynamic config
 * API keys come from EAS secrets (set via eas secret:create)
 * Referenced in eas.json env as $EXPO_PUBLIC_GEMINI_API_KEY
 */
module.exports = ({ config }) => {
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  const openRouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

  if (geminiKey.length > 10) {
    console.log(`[app.config.js] GEMINI key: YES (${geminiKey.slice(0, 8)}...)`);
  } else {
    console.log('[app.config.js] GEMINI key: NOT SET — app will use Cloudflare Worker only');
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      geminiApiKey: geminiKey,
      openRouterApiKey: openRouterKey,
    },
  };
};
