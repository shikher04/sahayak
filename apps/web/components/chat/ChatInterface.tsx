"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send, Loader2, MessageCircle, FileText, RefreshCw, Globe,
} from "lucide-react";

interface Source {
  title: string;
  chunk_type: string;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  docsRetrieved?: number;
  streaming?: boolean;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "mr", label: "मराठी" },
  { code: "bn", label: "বাংলা" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

function SourceList({ sources, count }: { sources: Source[]; count: number }) {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FileText className="w-3 h-3" />
        {t("rag_indicator", { count })}
      </button>

      {open && sources.length > 0 && (
        <div className="mt-2 space-y-1 animate-fade-in">
          {sources.map((src, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron flex-shrink-0" />
              <span className="font-medium truncate">{src.title}</span>
              {src.chunk_type && (
                <span className="flex-shrink-0 text-gray-400 capitalize">{src.chunk_type}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  initialScheme?: string;
  initialRight?: string;
}

/** Full streaming chat interface using SSE from the RAG endpoint. */
export function ChatInterface({ initialScheme, initialRight }: ChatInterfaceProps) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(
    initialScheme
      ? `Tell me about the ${initialScheme} scheme and how to apply.`
      : initialRight
      ? `Explain my rights regarding ${initialRight}.`
      : ""
  );
  const [language, setLanguage] = useState("en");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query.trim(),
    };

    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/rag/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), language }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: Source[] = [];
      let docsRetrieved = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data.startsWith("[DONE]")) {
            try {
              const meta = JSON.parse(data.slice(6));
              sources = meta.sources ?? [];
              docsRetrieved = meta.docs_retrieved ?? 0;
            } catch {
              // ignore parse errors
            }
            break;
          }

          if (data.startsWith("[ERROR]")) {
            fullContent += data.slice(7);
            break;
          }

          // Unescape newlines encoded by the backend
          fullContent += data.replace(/\\n/g, "\n");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullContent } : m
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: fullContent, sources, docsRetrieved, streaming: false }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: t("error"), streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, language, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const QUICK_QUESTIONS = t.raw("quick_questions") as string[];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-saffron flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">{t("title")}</div>
            <div className="text-xs text-gray-400">{t("subtitle")}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Globe className="w-3.5 h-3.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-saffron bg-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setMessages([])}
            className="btn-ghost text-xs p-2"
            title={t("new_chat")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-surface">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-saffron" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Ask Sahayak anything</h3>
              <p className="text-sm text-gray-400">Government schemes, legal rights, how to apply</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-full text-gray-600
                    hover:border-saffron hover:text-saffron transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-saffron flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                <MessageCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] ${
                msg.role === "user"
                  ? "bg-saffron text-white rounded-2xl rounded-tr-sm px-4 py-3"
                  : "bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className={`prose prose-sm max-w-none text-gray-800 ${msg.streaming && !msg.content ? "streaming-cursor" : ""}`}>
                  {msg.streaming && !msg.content ? (
                    <span className="text-gray-400 text-sm">{t("thinking")}</span>
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      {msg.streaming && <span className="streaming-cursor" />}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}

              {!msg.streaming && msg.sources && msg.docsRetrieved !== undefined && (
                <SourceList sources={msg.sources} count={msg.docsRetrieved} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        {/* Quick chips when there are messages */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_QUESTIONS.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isStreaming}
                className="flex-shrink-0 text-xs px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full
                  text-gray-500 hover:text-saffron hover:border-saffron transition-colors disabled:opacity-50"
              >
                {q.length > 40 ? q.slice(0, 40) + "…" : q}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            disabled={isStreaming}
            rows={1}
            className="input resize-none min-h-[44px] max-h-32 py-3 flex-1 disabled:opacity-60"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="btn-primary h-11 w-11 p-0 justify-center flex-shrink-0 disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
