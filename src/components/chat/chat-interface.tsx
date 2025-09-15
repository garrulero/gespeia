

"use client";

import { useState } from 'react';
import type { Message, LayoutMode } from '@/lib/types';
import { getGeminiResponse } from '@/app/actions';
import { ChatMessages } from './chat-messages';
import { MessageInput } from './message-input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DebugView, Event } from './debug-view';
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

type ChatInterfaceProps = {
  onLayoutChange: (mode: LayoutMode) => void;
};

export default function ChatInterface({ onLayoutChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugEvents, setDebugEvents] = useState<Event[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientPhoneInput, setClientPhoneInput] = useState("");

  const { toast } = useToast();

  const addDebugEvent = (message: string, data?: any, type: Event['type'] = 'info') => {
    setDebugEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    }]);
  };

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
    setDebugEvents([]); // Clear previous debug events

    addDebugEvent('Raw input to AI', { 
        history: newMessages.slice(0, -1),
        message: text, 
        activeClientPhone: activeClient 
    }, 'input');

    const result = await getGeminiResponse({ 
        history: newMessages.slice(0, -1), // Exclude current user message from history
        message: text, 
        activeClientPhone: activeClient 
    });
    
    if (result.success) {
        if (result.response) {
            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.response,
            };
            setMessages(prev => [...prev, assistantMessage]);
        }
        
        if (result.toolCalls && result.toolCalls.length > 0) {
            result.toolCalls.forEach(tc => {
                addDebugEvent(`Tool Call: ${tc.tool}`, { args: tc.args, output: tc.output }, 'tool');
            });
        }
        
        if (result.order) {
            addDebugEvent(`Order ${result.order.orderId} created`, result.order, 'info');
        }
    } else {
        const errorMessage = result.error || "An unknown error occurred.";
        addDebugEvent(errorMessage, undefined, 'error');

        if (errorMessage.includes("503") || errorMessage.toLowerCase().includes("overloaded")) {
             const serviceUnavailableMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Lo siento, el servicio de IA está sobrecargado en este momento. Por favor, inténtalo de nuevo en unos momentos.",
            };
            setMessages(prev => [...prev, serviceUnavailableMessage]);
            toast({
                variant: "destructive",
                title: "Servicio no disponible",
                description: "El modelo de IA está sobrecargado. Inténtalo más tarde.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        }

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
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex items-center justify-end border-b bg-card px-4 py-2 text-card-foreground">
        <div className="flex items-center gap-2">
            {activeClient && (
                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                    <User className="h-4 w-4" />
                    <span>{activeClient}</span>
                </div>
            )}
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">Seleccionar Cliente</Button>
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
                <DebugView events={debugEvents} />
            </TabsContent>
        </div>
        <footer className="border-t bg-card/50 p-2 md:p-4">
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </footer>
      </Tabs>
    </div>
  );
}
