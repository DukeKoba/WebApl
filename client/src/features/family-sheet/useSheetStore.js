import { useCallback, useEffect, useRef, useState } from 'react';
import { SCHEMA_VERSION, emptySheet } from './schema';

// 状態はブラウザの localStorage のみ。サーバーには一切送らない(45号 P1原則)。
const STORAGE_KEY = 'familySheet.v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // 将来のスキーマ変更に備えたマイグレーションポイント
    if (parsed.schemaVersion !== SCHEMA_VERSION) return migrate(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function migrate(old) {
  // 現状 v1 のみ。未知バージョンは owner/policies を可能な範囲で拾う
  const base = emptySheet();
  return {
    ...base,
    owner: old.owner || base.owner,
    policies: Array.isArray(old.policies) ? old.policies : [],
    contacts: Array.isArray(old.contacts) ? old.contacts : [],
    message: typeof old.message === 'string' ? old.message : '',
    createdAt: old.createdAt || '',
  };
}

export function useSheetStore() {
  const [sheet, setSheet] = useState(() => load() || emptySheet());
  const [hydratedExisting] = useState(() => !!load());
  const persist = useRef(true);
  const timer = useRef(null);

  // debounce 保存(共有PC向けに保存OFFも可)
  useEffect(() => {
    if (!persist.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...sheet, schemaVersion: SCHEMA_VERSION }));
      } catch { /* 容量超過等は無視(画像は保存しない方針のため通常到達しない) */ }
    }, 400);
    return () => timer.current && clearTimeout(timer.current);
  }, [sheet]);

  const update = useCallback((patch) => {
    setSheet((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const addPolicies = useCallback((policies) => {
    setSheet((prev) => ({
      ...prev,
      policies: [...prev.policies, ...policies],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const clearAll = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    setSheet(emptySheet());
  }, []);

  // 引き継ぎ(代理店→契約者/端末間)。取り込んだ下書きで丸ごと置き換える。
  const replaceAll = useCallback((next) => {
    setSheet({ ...emptySheet(), ...next, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() });
  }, []);

  const setPersist = useCallback((on) => {
    persist.current = on;
    if (!on) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ } }
  }, []);

  return { sheet, setSheet, update, addPolicies, clearAll, replaceAll, setPersist, hydratedExisting };
}
