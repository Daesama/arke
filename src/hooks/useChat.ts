"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  generatePrompt?: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  designImageUrl: string | null;
  designId: string | null;
  sendMessage: (content: string, imageBase64?: string) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¿Qué diseño quieres? Describe la idea o sube una imagen.",
  timestamp: new Date(),
};

function extractGeneratePrompt(text: string): string | undefined {
  const match = text.match(/\[GENERATE_IMAGE:\s*([\s\S]*?)\]/);
  return match ? match[1].trim() : undefined;
}

function stripGenerateTag(text: string): string {
  return text.replace(/\[GENERATE_IMAGE:\s*[\s\S]*?\]/g, "").trim();
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designImageUrl, setDesignImageUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      if (!content.trim() && !imageBase64) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        imageBase64,
        timestamp: new Date(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const apiMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg].map(
          (m) => ({
            role: m.role,
            content: m.content,
            imageBase64: m.imageBase64,
          }),
        );

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream body");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          const currentText = fullText;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: currentText } : m,
            ),
          );
        }

        const generatePrompt = extractGeneratePrompt(fullText);
        const cleanContent = stripGenerateTag(fullText);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: cleanContent, generatePrompt }
              : m,
          ),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Chat error:", err);
        setError("Error en el chat. Intentá de nuevo.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [messages],
  );

  const generateImage = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userPrompt = lastUserMsg?.content || prompt;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, userPrompt }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();

      if (data.imageUrl) {
        setDesignImageUrl(data.imageUrl);
        setDesignId(data.designId ?? null);
      }

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError("Error generando el diseño. Intentá de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    isGenerating,
    error,
    designImageUrl,
    designId,
    sendMessage,
    generateImage,
  };
}
