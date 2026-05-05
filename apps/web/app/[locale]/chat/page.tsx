import { ChatInterface } from "@/components/chat/ChatInterface";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Chat — Sahayak" };

interface ChatPageProps {
  searchParams: { scheme?: string; right?: string };
}

export default function ChatPage({ searchParams }: ChatPageProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      <ChatInterface
        initialScheme={searchParams.scheme}
        initialRight={searchParams.right}
      />
    </div>
  );
}
