"use client";

import { useState } from 'react';
import type { Message } from '@/lib/types';
import { getGeminiResponse } from '@/app/actions';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { GeminiLogo } from '../icons/gemini-logo';
import { useToast } from '@/hooks/use-toast';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const result = await getGeminiResponse(text);
    
    if (result.success && result.response) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Sorry, I couldn't get a response. Please try again.",
      });
    }

    setIsLoading(false);
  };

  const updateMessage = (messageId: string, newContent: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    );
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <GeminiLogo className="h-8 w-8" />
        <h1 className="text-xl font-bold">ChatGemini</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatMessages messages={messages} isLoading={isLoading} onUpdateMessage={updateMessage} />
      </main>
      <footer className="border-t bg-card/50 p-2 md:p-4">
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
}
