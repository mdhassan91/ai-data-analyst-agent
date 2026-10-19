"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { HistoryItemType, Message } from "@/types";
import { sendMessage as callApi, ApiError } from "@/utils/api";
import { useHistory } from "@/hooks/useHistory";

const MESSAGES_STORE_KEY = "ai-data-analyst-message-log";

function loadMessageLog(): Record<string, Message> {
  try {
    const raw = window.localStorage.getItem(MESSAGES_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMessageLog(log: Record<string, Message>) {
  window.localStorage.setItem(MESSAGES_STORE_KEY, JSON.stringify(log));
}

function classifyResponseType(msg: Message): HistoryItemType {
  if (msg.visualization) return "chart";
  if (msg.data) return "table";
  return "text";
}

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const lastUserMessageRef = useRef<string>("");

  const { history, addHistoryItem, clearHistory } = useHistory();

  const appendToLog = useCallback((msg: Message) => {
    const log = loadMessageLog();
    log[msg.id] = msg;
    saveMessageLog(log);
  }, []);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setViewingHistoryId(null);
      lastUserMessageRef.current = trimmed;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const pendingId = uuidv4();
      const pendingMessage: Message = {
        id: pendingId,
        role: "ai",
        content: "",
        timestamp: Date.now(),
        isPending: true,
      };

      setMessages((prev) => [...prev, userMessage, pendingMessage]);
      appendToLog(userMessage);
      setIsLoading(true);

      try {
        const response = await callApi({ message: trimmed, session_id: sessionId });

        const aiMessage: Message = {
          id: pendingId,
          role: "ai",
          content: response.response,
          data: response.data,
          visualization: response.visualization,
          sql: response.sql,
          timestamp: Date.now(),
        };

        setMessages((prev) => prev.map((m) => (m.id === pendingId ? aiMessage : m)));
        appendToLog(aiMessage);

        addHistoryItem({
          query: trimmed,
          type: classifyResponseType(aiMessage),
          userMessageId: userMessage.id,
          aiMessageId: aiMessage.id,
        });
      } catch (err) {
        const errorText =
          err instanceof ApiError
            ? `Sorry, I encountered an error. ${err.message}`
            : "Sorry, I encountered an error. Please try again.";

        const errorMessage: Message = {
          id: pendingId,
          role: "ai",
          content: errorText,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? errorMessage : m)));
        appendToLog(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, appendToLog, addHistoryItem]
  );

  const retryLastMessage = useCallback(() => {
    if (lastUserMessageRef.current) {
      // Remove the trailing user+error pair before resending.
      setMessages((prev) => prev.slice(0, -2));
      sendUserMessage(lastUserMessageRef.current);
    }
  }, [sendUserMessage]);

  const startNewSession = useCallback(() => {
    setMessages([]);
    setViewingHistoryId(null);
  }, []);

  const viewHistoryItem = useCallback(
    (userMessageId: string, aiMessageId: string, historyId: string) => {
      const log = loadMessageLog();
      const userMsg = log[userMessageId];
      const aiMsg = log[aiMessageId];
      if (userMsg && aiMsg) {
        setMessages([userMsg, aiMsg]);
        setViewingHistoryId(historyId);
      }
    },
    []
  );

  return {
    messages,
    isLoading,
    sendUserMessage,
    retryLastMessage,
    startNewSession,
    viewingHistoryId,
    viewHistoryItem,
    history,
    clearHistory,
  };
}
