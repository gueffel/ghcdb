import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api.js';

const HintsContext = createContext(null);

export function HintsProvider({ children }) {
  const [hintsEnabled, setHintsEnabledState] = useState(true);
  const [seenHints, setSeenHints] = useState({});
  const [loaded, setLoaded] = useState(false);
  const enabledRef = useRef(true);
  const seenRef = useRef({});
  const saveTimer = useRef(null);

  useEffect(() => {
    api.getHintsState()
      .then(data => {
        if (data) {
          const on = data.hints_enabled !== false;
          const seen = data.hints_seen || {};
          enabledRef.current = on;
          seenRef.current = seen;
          setHintsEnabledState(on);
          setSeenHints(seen);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.saveHintsState(enabledRef.current, seenRef.current).catch(() => {});
    }, 800);
  }, []);

  const markSeen = useCallback((id) => {
    setSeenHints(prev => {
      const next = { ...prev, [id]: true };
      seenRef.current = next;
      scheduleSave();
      return next;
    });
  }, [scheduleSave]);

  const setEnabled = useCallback((val) => {
    enabledRef.current = val;
    setHintsEnabledState(val);
    scheduleSave();
  }, [scheduleSave]);

  const reset = useCallback(() => {
    enabledRef.current = true;
    seenRef.current = {};
    setHintsEnabledState(true);
    setSeenHints({});
    scheduleSave();
  }, [scheduleSave]);

  return (
    <HintsContext.Provider value={{ hintsEnabled, seenHints, markSeen, setEnabled, reset, loaded }}>
      {children}
    </HintsContext.Provider>
  );
}

export const useHints = () => useContext(HintsContext);

export function usePageHints(hints) {
  const ctx = useHints();
  if (!ctx?.loaded || !ctx.hintsEnabled) return null;
  const unseen = hints.filter(h => h.enabled !== false && !ctx.seenHints[h.id]);
  if (!unseen.length) return null;
  return {
    hint: unseen[0],
    remaining: unseen.length,
    markSeen: ctx.markSeen,
    disable: ctx.setEnabled,
  };
}
