"use client";

import { PanelLeft, Sparkles, RotateCw } from "lucide-react";
import { IconButton } from "@/components/UI/IconButton";
import { Button } from "@/components/UI/Button";

interface Props {
  onToggleSidebar: () => void;
  onNewSession: () => void;
}

export function Header({ onToggleSidebar, onNewSession }: Props) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <IconButton label="Toggle history" onClick={onToggleSidebar}>
          <PanelLeft size={18} />
        </IconButton>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-purple/20 text-accent-purple">
          <Sparkles size={18} />
        </span>
        <div>
          <h1 className="text-base font-bold text-white sm:text-lg">AI Data Analyst</h1>
          <p className="hidden text-xs text-white/45 sm:block">
            Analyze e-commerce data with natural language
          </p>
        </div>
      </div>

      <Button variant="ghost" onClick={onNewSession} className="px-3 py-2 text-xs sm:px-4 sm:text-sm">
        <RotateCw size={14} />
        <span className="hidden sm:inline">New Session</span>
      </Button>
    </header>
  );
}
