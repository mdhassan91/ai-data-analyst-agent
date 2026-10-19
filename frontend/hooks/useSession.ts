"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "ai-data-analyst-session-id";

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) {
      setSessionId(existing);
    } else {
      const fresh = uuidv4();
      window.localStorage.setItem(SESSION_KEY, fresh);
      setSessionId(fresh);
    }
  }, []);

  const regenerateSession = useCallback(() => {
    const fresh = uuidv4();
    window.localStorage.setItem(SESSION_KEY, fresh);
    setSessionId(fresh);
    return fresh;
  }, []);

  return { sessionId, regenerateSession };
}
