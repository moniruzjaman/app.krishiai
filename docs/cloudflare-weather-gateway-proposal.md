# API Gateway Recovery Plan (Cloudflare Worker Down, APK Build Safe)

## Decision
- Keep weather flow unchanged (working now).
- Recover and stabilize Cloudflare Worker only.
- Do not change Expo runtime/build behavior in this phase.

## Why this can be fixed without harming APK builds
The repository already separates pipelines:
- APK workflow ignores `worker/**` path changes.
- Worker deploy workflow triggers only from `worker/worker.js` / `worker/wrangler.toml` changes.

So Worker fixes can ship independently if we keep this separation strict.

## Current Worker Model Baseline (keep as-is first)
Classifier cascade:
1. gemini-2.5-flash-lite
2. gemini-2.5-flash
3. gemini-2.0-flash
4. glm-4.6v
5. llama-4-scout

Advisory/chat cascade remains Gemini -> Z.AI -> OpenRouter.

## Recovery Plan (No APK disruption)

### Phase 0 — Fast triage (same day)
1. Verify Worker health endpoint manually (`GET /`).
2. Confirm required secrets exist in Cloudflare for production Worker:
   - `GEMINI_API_KEY`
   - `OPENROUTER_API_KEY`
   - `ZAI_API_KEY` (optional fallback)
3. Deploy Worker only from worker pipeline, do not trigger APK workflow.
4. Add temporary verbose error logging in Worker deploy/test workflow (not app runtime).

### Phase 1 — Make Worker robust against provider failures
1. Add per-attempt timeout wrapper for each provider call.
2. Add unified error payload:
   `{ ok:false, code, stage, provider, model, requestId, retryable }`.
3. Add circuit-breaker memory window:
   - trip provider after repeated failures,
   - cooldown before retrying provider.
4. Return safe Bengali fallback advisory if all providers fail.

### Phase 2 — Remove Worker/Expo coupling risk
1. Keep Worker URL as existing public endpoint in app code (no client contract break).
2. Keep all Worker secrets out of Expo/EAS env where not required.
3. Ensure no Worker deploy command is run in APK build workflow.
4. Use explicit workflow dispatch for Worker rollback/redeploy.

### Phase 3 — Verification gates before release
1. Worker smoke suite must pass:
   - health check,
   - text chat request,
   - image diagnose request (sample payload).
2. Only after smoke pass, mark Worker deploy successful.
3. APK pipeline remains unchanged and independent.

## Likely root causes when Worker is "down"
1. Missing/expired Cloudflare secrets.
2. Free-tier provider quota exhaustion.
3. Provider timeout cascade (sequential retries too slow).
4. Worker deploy succeeded but runtime errors hidden (insufficient logs).
5. DNS/domain route mismatch with latest deployment.

## Highest Vision Enhancement (after recovery)
Only after Worker is stable:
1. Add optional second-pass high-vision lane for low-confidence cases.
2. Keep first pass as current fast/free cascade to control cost.
3. Gate with `quality_mode=balanced|high` + daily quota cap.
4. If premium vision disagrees with fast label, return conservative advisory + recheck note.

## Zero-risk rollout
1. **Shadow mode:** log new failover logic while serving existing behavior.
2. **Canary:** enable for small request percentage.
3. **Kill switch:** one env flag to revert to today’s static cascade instantly.

## Immediate action checklist
1. Validate Cloudflare secrets and quotas now.
2. Run worker-only smoke tests from GitHub Actions.
3. Add timeout + error envelope + requestId.
4. Add circuit-breaker around unstable providers.
5. Roll out in shadow -> canary -> full.
