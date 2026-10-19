"use client";

import { KeyboardEvent, forwardRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  value?: string;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, Props>(function MessageInput(
  { onSend, disabled, value },
  ref
) {
  const [text, setText] = useState(value ?? "");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-card border border-base-border bg-base-input p-2 focus-within:border-accent-tealTo/50">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask about your e-commerce data..."
        aria-label="Message input"
        className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-accent-tealFrom to-accent-tealTo text-base-bg transition-transform hover:brightness-110 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
      >
        <SendHorizontal size={18} />
      </button>
    </div>
  );
});
