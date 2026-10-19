"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { HistoryItemType, QueryHistoryItem } from "@/types";

const HISTORY_KEY = "ai-data-analyst-history";
const MAX_HISTORY_ITEMS = 20;

export function useHistory() {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      // Corrupt localStorage data — start fresh rather than crash.
      setHistory([]);
    }
  }, []);

  const persist = useCallback((items: QueryHistoryItem[]) => {
    setHistory(items);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  }, []);

  const addHistoryItem = useCallback(
    (args: {
      query: string;
      type: HistoryItemType;
      userMessageId: string;
      aiMessageId: string;
    }) => {
      const item: QueryHistoryItem = {
        id: uuidv4(),
        query: args.query.slice(0, 50),
        timestamp: Date.now(),
        type: args.type,
        userMessageId: args.userMessageId,
        aiMessageId: args.aiMessageId,
      };
      persist([item, ...history].slice(0, MAX_HISTORY_ITEMS));
    },
    [history, persist]
  );

  const clearHistory = useCallback(() => {
    persist([]);
  }, [persist]);

  return { history, addHistoryItem, clearHistory };
}
