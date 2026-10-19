"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useChat } from "@/hooks/useChat";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { HistorySidebar } from "@/components/Sidebar/HistorySidebar";
import { ChatContainer } from "@/components/Chat/ChatContainer";
import type { QueryHistoryItem } from "@/types";

export default function Home() {
  const { sessionId } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    messages,
    isLoading,
    sendUserMessage,
    retryLastMessage,
    startNewSession,
    viewingHistoryId,
    viewHistoryItem,
    history,
    clearHistory,
  } = useChat(sessionId);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSelectHistory = (item: QueryHistoryItem) => {
    viewHistoryItem(item.userMessageId, item.aiMessageId, item.id);
    setIsSidebarOpen(false);
  };

  if (!sessionId) {
    // Session id is generated client-side on mount; avoid a flash of
    // interactive UI before it's ready.
    return null;
  }

  return (
    <div className="flex min-h-screen bg-base-bg">
      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={clearHistory}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          onNewSession={startNewSession}
        />

        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 pb-4 sm:px-8">
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            onSend={sendUserMessage}
            onRetry={retryLastMessage}
            isViewingHistory={viewingHistoryId !== null}
          />
        </main>

        <Footer />
      </div>
    </div>
  );
}
