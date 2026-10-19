"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "@/components/Chat/MessageBubble";
import { TypingIndicator } from "@/components/Chat/TypingIndicator";
import { MessageInput } from "@/components/Chat/MessageInput";
import { SampleQuestions } from "@/components/Chat/SampleQuestions";

interface Props {
  messages: Message[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
  isViewingHistory: boolean;
}

export function ChatContainer({ messages, isLoading, onSend, onRetry, isViewingHistory }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isEmpty = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const showRetry = lastMessage?.isError ?? false;

  return (
    <div className="flex h-full flex-col rounded-card bg-base-card shadow-card">
      <div
        role="log"
        aria-live="polite"
        className="flex min-h-[500px] max-h-[70vh] flex-1 flex-col gap-5 overflow-y-auto px-5 py-6 sm:px-8"
      >
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div>
              <p className="text-lg font-semibold text-white/90">
                Ask anything about your store
              </p>
              <p className="mt-1 text-sm text-white/50">
                Try one of these, or type your own question below.
              </p>
            </div>
            <SampleQuestions onSelect={onSend} />
          </div>
        ) : (
          <>
            {isViewingHistory && (
              <div className="mx-auto rounded-pill border border-base-border bg-base-input px-4 py-1.5 text-xs text-white/50">
                Viewing a past query — read only
              </div>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRetry={m.isError ? onRetry : undefined}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-base-border p-4 sm:p-5">
        <MessageInput ref={inputRef} onSend={onSend} disabled={isLoading || isViewingHistory} />
        {showRetry && !isLoading && (
          <p className="mt-2 text-center text-xs text-white/40">
            Press Enter or tap Retry above to try that question again.
          </p>
        )}
      </div>
    </div>
  );
}
