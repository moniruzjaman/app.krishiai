/**
 * KrishiAI — Network Utility
 * Shared offline detection, retry logic, and error messages for all tools.
 */
import { useState, useEffect, useCallback } from 'react';

// ── Offline check via worker ping ────────────────────────────────────────────
export async function checkOnline(): Promise<boolean> {
  try {
    const res = await fetch('https://app-krishiai.mithun-hstu.workers.dev', {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const online = await checkOnline();
    setIsOnline(online);
    setChecking(false);
    return online;
  }, []);

  useEffect(() => { check(); }, []);
  return { isOnline, checking, check };
}

// ── Retry with backoff ────────────────────────────────────────────────────────
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1000,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

// ── Bengali error messages ────────────────────────────────────────────────────
export function getErrorMsg(err: unknown): string {
  const m = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'ইন্টারনেট সংযোগ নেই। WiFi বা মোবাইল ডেটা চালু করুন।';
  if (m.includes('timeout') || m.includes('abort'))
    return 'সার্ভার সাড়া দিচ্ছে না। একটু পরে আবার চেষ্টা করুন।';
  if (m.includes('503') || m.includes('unavailable'))
    return 'AI সেবা সাময়িকভাবে বন্ধ। কিছুক্ষণ পরে চেষ্টা করুন।';
  if (m.includes('permission') || m.includes('location'))
    return 'অবস্থান অনুমতি প্রয়োজন। সেটিংসে গিয়ে অনুমতি দিন।';
  return 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
}

export const OFFLINE_MSG = '📡 ইন্টারনেট নেই — অফলাইন মোড';
