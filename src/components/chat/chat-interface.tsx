"use client";

import { useState } from 'react';
import type { Message } from '@/lib/types';
import { getGeminiResponse } from '@/app/actions';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { GeminiLogo } from '../icons/gemini-logo';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebugView } from './debug-view';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    const result = await getGeminiResponse(newMessages.slice(0, -1), text);
    
    if (result.success && result.response) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } else {
      const errorPayload = {
        timestamp: new Date().toISOString(),
        message: result.error || "Sorry, I couldn't get a response. Please try again.",
        context: 'getGeminiResponse'
      };
      setErrors(prev => [...prev, errorPayload]);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorPayload.message,
      });
      // remove the user message if the call fails
      setMessages(messages);
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
      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        <div className="flex flex-1 flex-col overflow-hidden">
            <TabsContent value="chat" className="flex-1 overflow-auto m-0">
                <ChatMessages messages={messages} isLoading={isLoading} onUpdateMessage={updateMessage} />
            </TabsContent>
            <TabsContent value="debug" className="flex-1 overflow-y-auto m-0">
                <DebugView messages={messages} errors={errors} />
            </TabsContent>
        </div>
        <footer className="border-t bg-card/50 p-2 md:p-4">
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </Tabs>
    </div>
  );
}
