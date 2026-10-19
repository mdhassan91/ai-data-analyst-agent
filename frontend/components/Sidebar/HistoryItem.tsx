import { BarChart3, Table2, MessageSquare } from "lucide-react";
import type { QueryHistoryItem } from "@/types";

function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

const ICONS = {
  chart: BarChart3,
  table: Table2,
  text: MessageSquare,
};

export function HistoryItem({
  item,
  onClick,
}: {
  item: QueryHistoryItem;
  onClick: () => void;
}) {
  const Icon = ICONS[item.type];

  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/5"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-purple/15 text-accent-purple">
        <Icon size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white/85">{item.query}</span>
        <span className="mt-0.5 block text-xs text-white/40">{timeAgo(item.timestamp)}</span>
      </span>
    </button>
  );
}
