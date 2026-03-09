/**
 * KrishiAI Worker Service
 * Calls Cloudflare Worker — Hybrid Crop Doctor v2
 * 
 * Worker flow:
 *   Step 1: classifyDisease (20 tokens) → disease label
 *   Step 2: focused advisory prompt (600 tokens) → Bangla advice
 *   Total: ~70-80% cheaper than raw image analysis
 */

const WORKER_URL = 'https://app-krishiai.mithun-hstu.workers.dev';

export interface WorkerResponse {
  text: string;
  model: string;
  diseaseKey?: string;
  diseaseName?: string;
  architecture?: string;
}

/** Diagnose crop disease from image */
export async function diagnoseWithWorker(
  imageBase64: string,
  cropHint?: string,
): Promise<WorkerResponse> {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, cropHint: cropHint || '' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error || `Worker error ${res.status}`);
  }
  return res.json() as Promise<WorkerResponse>;
}

/** Chat — text only query */
export async function chatWithWorker(prompt: string): Promise<WorkerResponse> {
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error || `Worker error ${res.status}`);
  }
  return res.json() as Promise<WorkerResponse>;
}

/** Legacy callWorker — kept for backward compatibility */
export async function callWorker(prompt: string, imageBase64?: string | null): Promise<WorkerResponse> {
  if (imageBase64) return diagnoseWithWorker(imageBase64, prompt);
  return chatWithWorker(prompt);
}

export async function checkWorkerHealth(): Promise<boolean> {
  try {
    const res = await fetch(WORKER_URL, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
