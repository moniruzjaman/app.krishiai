/**
 * KrishiAI Worker Service
 * Calls the Cloudflare Worker gateway instead of AI APIs directly.
 * Worker URL: https://app-krishiai.mithun-hstu.workers.dev
 *
 * Benefits:
 * - API keys never in the app (stored in Cloudflare secrets)
 * - Automatic AI cascade on the server side
 * - Works even if EXPO_PUBLIC_ env vars are missing
 */

const WORKER_URL = 'https://app-krishiai.mithun-hstu.workers.dev';

export interface WorkerResponse {
  text: string;
  model: string;
  log?: { model: string; error?: string }[];
}

export async function callWorker(
  prompt: string,
  imageBase64?: string | null,
): Promise<WorkerResponse> {
  const body: Record<string, string> = { prompt };
  if (imageBase64) body.imageBase64 = imageBase64;

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error || `Worker error ${res.status}`);
  }

  return res.json() as Promise<WorkerResponse>;
}

export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const res = await fetch(WORKER_URL, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
