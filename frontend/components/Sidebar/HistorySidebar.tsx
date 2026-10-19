"use client";

import { X, Trash2 } from "lucide-react";
import type { QueryHistoryItem } from "@/types";
import { HistoryItem } from "@/components/Sidebar/HistoryItem";
import { IconButton } from "@/components/UI/IconButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: QueryHistoryItem[];
  onSelect: (item: QueryHistoryItem) => void;
  onClear: () => void;
}

export function HistorySidebar({ isOpen, onClose, history, onSelect, onClear }: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        role="complementary"
        aria-label="Query history"
        aria-expanded={isOpen}
        className={`fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] border-r border-base-border bg-base-card/95 backdrop-blur-md transition-transform duration-200 md:static md:z-0 md:w-72 md:translate-x-0 md:border-r md:bg-base-card/60 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${isOpen ? "" : "md:hidden"}`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
              History
            </h2>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs text-white/40 hover:bg-accent-danger/10 hover:text-accent-danger"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
              <IconButton label="Close history" onClick={onClose} className="md:hidden">
                <X size={18} />
              </IconButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {history.length === 0 ? (
              <p className="mt-8 text-center text-sm text-white/35">
                Your recent questions will show up here.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {history.map((item) => (
                  <HistoryItem key={item.id} item={item} onClick={() => onSelect(item)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
