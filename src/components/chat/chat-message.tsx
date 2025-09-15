"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { ChatAvatar } from "./chat-avatar";

type ChatMessageProps = {
  message: Message;
  isLoading?: boolean;
};

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && <ChatAvatar role="assistant" />}
      <div className={cn("max-w-[75%] space-y-1", { "order-first": isUser })}>
        <div className={cn(
            "group relative rounded-lg px-3 py-2 shadow-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-card",
            isLoading && "p-0"
          )}
        >
          {isLoading ? (
             <div className="flex items-center space-x-2 p-2">
                <div className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
                <div className="h-2 w-2 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
                <div className="h-2 w-2 rounded-full bg-muted animate-bounce" />
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
      {isUser && <ChatAvatar role="user" />}
    </div>
  );
}
