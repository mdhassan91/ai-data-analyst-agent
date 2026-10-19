import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex animate-fadeSlideIn items-start gap-3" role="status" aria-label="AI is thinking">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
        <Sparkles size={16} />
      </span>
      <div className="rounded-card rounded-tl-md bg-base-bubbleAi px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-white/60 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-white/60 [animation-delay:160ms]" />
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-white/60 [animation-delay:320ms]" />
          <span className="ml-1 text-xs text-white/50">AI is thinking...</span>
        </div>
      </div>
    </div>
  );
}
