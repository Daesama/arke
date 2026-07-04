"use client";

import { useRef, useEffect } from "react";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";

interface ChatWindowProps {
  onDesignGenerated?: (imageUrl: string, designId: string | null) => void;
}

export function ChatWindow({ onDesignGenerated }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    isGenerating,
    error,
    designImageUrl,
    designId,
    sendMessage,
    generateImage,
  } = useChat();

  const prevDesignRef = useRef(designImageUrl);

  useEffect(() => {
    if (designImageUrl && designImageUrl !== prevDesignRef.current) {
      prevDesignRef.current = designImageUrl;
      onDesignGenerated?.(designImageUrl, designId);
    }
  }, [designImageUrl, designId, onDesignGenerated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  function handleSend(content: string, imageBase64?: string) {
    sendMessage(content, imageBase64);
  }

  async function handleGenerate(prompt: string) {
    await generateImage(prompt);
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-elevated bg-deep">
      <div className="flex items-center gap-2 border-b border-elevated px-4 py-3">
        <div className="rounded-lg bg-violet/10 p-1.5 text-violet">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary font-heading">ARKE IA</p>
          <p className="text-xs text-text-muted font-mono">Asistente creativo</p>
        </div>
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />
            <span className="text-xs text-text-muted">Escribiendo...</span>
          </div>
        )}
        {isGenerating && (
          <div className="ml-auto flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet" />
            <span className="text-xs text-violet">Generando imagen...</span>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10 text-violet">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-cyan/10 bg-deep px-4 py-3">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-magenta/30 bg-magenta/10 px-3 py-2 text-xs text-magenta">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
