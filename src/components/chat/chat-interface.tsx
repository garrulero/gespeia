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
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientPhoneInput, setClientPhoneInput] = useState("");

  const { toast } = useToast();

  const handleSetClient = () => {
    if (clientPhoneInput) {
      setActiveClient(clientPhoneInput);
      setIsClientDialogOpen(false);
      toast({
        title: "Cliente seleccionado",
        description: `Los pedidos se realizarán para el teléfono: ${clientPhoneInput}`,
      });
    }
  };

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

    const result = await getGeminiResponse({ 
        history: newMessages, 
        message: text, 
        activeClientPhone: activeClient 
    });
    
    if (result.success && result.response) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.response,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.order) {
        const orderPayload = {
            timestamp: new Date().toISOString(),
            message: `Order ${result.order.orderId} created successfully.`,
            context: 'createOrder',
            data: result.order,
        };
        setErrors(prev => [...prev, orderPayload]);
      }
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
      <header className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <div className="flex items-center gap-3">
            <GeminiLogo className="h-8 w-8" />
            <h1 className="text-xl font-bold">ChatGemini</h1>
        </div>
        <div className="flex items-center gap-2">
            {activeClient && (
                <div className="flex items-center gap-2 text-sm bg-primary-foreground/20 px-3 py-1 rounded-full">
                    <User className="h-4 w-4" />
                    <span>{activeClient}</span>
                </div>
            )}
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" size="sm">Seleccionar Cliente</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Seleccionar o Crear Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Teléfono
                            </Label>
                            <Input
                                id="phone"
                                value={clientPhoneInput}
                                onChange={(e) => setClientPhoneInput(e.target.value)}
                                className="col-span-3"
                                placeholder="Número de teléfono ficticio"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSetClient}>Guardar Cliente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </header>
      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        <div className="flex flex-1 flex-col overflow-hidden">
            <TabsContent value="chat" className="flex-1 overflow-auto m-0 flex flex-col">
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
