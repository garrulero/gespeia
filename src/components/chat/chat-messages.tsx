"use client";

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import type { Message } from '@/lib/types';

type ChatMessagesProps = {
  messages: Message[];
  isLoading: boolean;
  onUpdateMessage: (messageId: string, newContent: string) => void;
};

export function ChatMessages({ messages, isLoading, onUpdateMessage }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <ScrollArea className="h-full" ref={scrollAreaRef}>
      <div className="p-4 md:p-6 space-y-4">
        {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onUpdateMessage={onUpdateMessage}
            />
        ))}
        {isLoading && (
          <ChatMessage
            message={{ id: 'loading', role: 'assistant', content: '...' }}
            isLoading
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
