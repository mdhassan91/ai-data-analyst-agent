import { Sparkles, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@/types";
import { DataTable } from "@/components/UI/DataTable";
import { ChartRenderer } from "@/components/Visualizations/ChartRenderer";
import { Button } from "@/components/UI/Button";

interface Props {
  message: Message;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-fadeSlideIn items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      role="article"
      aria-label={isUser ? "Your message" : "AI response"}
    >
      {!isUser && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
          <Sparkles size={16} />
        </span>
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-card px-4 py-3 shadow-card ${
            isUser
              ? "rounded-tr-md bg-base-bubbleUser text-white"
              : `rounded-tl-md bg-base-bubbleAi text-white/90 ${message.isError ? "border border-accent-danger/40" : ""}`
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="markdown-content text-sm leading-relaxed text-white/90">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {message.isError && onRetry && (
          <Button variant="ghost" onClick={onRetry} className="mt-2 px-3 py-1.5 text-xs">
            <RotateCcw size={13} />
            Retry
          </Button>
        )}

        {!isUser && message.visualization && (
          <div className="w-full min-w-[320px]">
            <ChartRenderer visualization={message.visualization} fallbackData={message.data} />
          </div>
        )}

        {!isUser && !message.visualization && message.data && (
          <div className="w-full min-w-[320px]">
            <DataTable data={message.data} />
          </div>
        )}
      </div>
    </div>
  );
}
