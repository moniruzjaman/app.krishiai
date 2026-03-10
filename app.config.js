/**
 * Expo dynamic config
 * SECURITY: No API keys stored in app or APK.
 * All AI calls route through Cloudflare Worker (keys are server-side).
 */
module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      workerUrl: 'https://app-krishiai.mithun-hstu.workers.dev',
    },
  };
};
