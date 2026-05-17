import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const STORAGE_PREFIX = 'admin-form-draft:';
const SAVED_AT_KEY = (k) => `${STORAGE_PREFIX}${k}:savedAt`;

/**
 * Form-state hook that auto-persists to localStorage so users don't lose work
 * when they switch tabs, refresh, or accidentally navigate away before saving.
 *
 * Usage:
 *   const { value, setValue, hydrateFromServer, clearDraft, hasDraft } =
 *     usePersistedForm(`package-form:${id || 'new'}`, blankForm);
 *
 * Lifecycle:
 *   1. On mount → looks for a saved draft under `key`; if found, restores and
 *      shows a toast "Draft restored from your last edit".
 *   2. Every change → debounce-saved (~400 ms).
 *   3. Edit-mode pages: call `hydrateFromServer(serverData)` after the API
 *      load. If a draft exists, the draft wins (assumes user was mid-edit).
 *      Otherwise the server data is used.
 *   4. After successful save → call `clearDraft()` so the next visit starts
 *      clean.
 *
 * The hook keeps the API surface identical to `[value, setValue]` for swap-in
 * convenience, plus extras for the load/save callbacks.
 */
export default function usePersistedForm(key, blankValue) {
  const [value, setValue] = useState(blankValue);
  const [hasDraft, setHasDraft] = useState(false);
  const hydratedRef = useRef(false);   // becomes true after initial mount restore
  const lastKeyRef = useRef(key);

  // Restore on first mount (or when key changes — e.g. id appears in URL).
  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft === 'object') {
          setValue((cur) => ({ ...cur, ...draft }));
          setHasDraft(true);
          // Slight delay so it doesn't fight a route-mount loading state.
          setTimeout(() => {
            toast('Draft restored from your last edit', {
              icon: '💾',
              duration: 3000,
            });
          }, 250);
        }
      }
    } catch {
      // ignore parse / quota errors
    }
    hydratedRef.current = true;
    lastKeyRef.current = key;
  }, [key]);

  // Auto-save on every change, lightly debounced.
  useEffect(() => {
    if (!hydratedRef.current || !key) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        localStorage.setItem(SAVED_AT_KEY(key), String(Date.now()));
      } catch {
        /* quota exhaustion is silently OK — worst case = lose persistence */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value, key]);

  /**
   * Apply server-fetched data ONLY when no draft is present. If a draft
   * exists, we prefer it (the user was mid-edit). The caller (edit-mode load
   * function) is expected to invoke this once after fetching.
   */
  const hydrateFromServer = useCallback((serverData) => {
    if (!key) return;
    let draftExists = false;
    try {
      draftExists = !!localStorage.getItem(STORAGE_PREFIX + key);
    } catch {}
    if (!draftExists) {
      setValue(serverData);
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
      localStorage.removeItem(SAVED_AT_KEY(key));
    } catch {}
    setHasDraft(false);
  }, [key]);

  /** Discard the current draft AND reset the form to its blank shape. */
  const discardDraft = useCallback(() => {
    clearDraft();
    setValue(blankValue);
    toast.success('Draft discarded');
  }, [clearDraft, blankValue]);

  return {
    value,
    setValue,
    hydrateFromServer,
    clearDraft,
    discardDraft,
    hasDraft,
  };
}
