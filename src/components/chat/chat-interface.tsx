

"use client";

import { useState, useEffect } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, Users } from 'lucide-react';
import { getClients, Client } from '@/services/client-service';
import { ScrollArea } from '../ui/scroll-area';

type ChatInterfaceProps = {
  onLayoutChange: (mode: LayoutMode) => void;
};

const MESSAGE_LIMIT = 100;

export default function ChatInterface({ onLayoutChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugEvents, setDebugEvents] = useState<Event[]>([]);
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientPhoneInput, setClientPhoneInput] = useState("");
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [clientList, setClientList] = useState<Client[]>([]);

  const { toast } = useToast();

  const fetchClients = async () => {
    const clients = await getClients();
    setClientList(clients);
  };

  const handleOpenClientDialog = (isOpen: boolean) => {
    if (isOpen) {
      fetchClients();
    }
    setIsClientDialogOpen(isOpen);
  }

  const addDebugEvent = (message: string, data?: any, type: Event['type'] = 'info') => {
    setDebugEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    }]);
  };

  const handleSetClient = (phone: string) => {
    if (phone) {
      setActiveClient(phone);
      setIsClientDialogOpen(false);
      setClientPhoneInput("");
      toast({
        title: "Cliente seleccionado",
        description: `Los pedidos se realizarán para el teléfono: ${phone}`,
      });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (messages.length >= MESSAGE_LIMIT) {
      setIsLimitModalOpen(true);
      return;
    }

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

  const isChatLocked = messages.length >= MESSAGE_LIMIT;

  return (
    <>
      <AlertDialog open={isLimitModalOpen} onOpenChange={setIsLimitModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Límite de la demo alcanzado</AlertDialogTitle>
            <AlertDialogDescription>
              Has alcanzado el límite de {MESSAGE_LIMIT} mensajes para esta sesión de demostración. Esto ayuda a mantener el servicio disponible para todos.
              <br /><br />
              Para continuar, por favor, recarga la página para iniciar una nueva conversación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>Recargar página</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex h-full w-full flex-col bg-background">
        <header className="flex items-center justify-between border-b bg-card px-4 py-2 text-card-foreground">
          <h2 className="text-lg font-semibold">Chat</h2>
          <div className="flex items-center gap-2">
              {activeClient && (
                  <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1 rounded-full">
                      <User className="h-4 w-4" />
                      <span>{activeClient}</span>
                  </div>
              )}
              <Dialog open={isClientDialogOpen} onOpenChange={handleOpenClientDialog}>
                  <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Seleccionar Cliente</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Seleccionar o Crear Cliente</DialogTitle>
                      </DialogHeader>
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Seleccionar un cliente existente</h3>
                            <ScrollArea className="h-48">
                                <div className="space-y-2 pr-4">
                                    {clientList.length > 0 ? clientList.map(client => (
                                        <Button 
                                            key={client.id} 
                                            variant="outline" 
                                            className="w-full justify-start"
                                            onClick={() => handleSetClient(client.phone)}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold">{client.name}</span>
                                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                                            </div>
                                        </Button>
                                    )) : (
                                        <div className="text-center text-muted-foreground py-4">
                                            <Users className="mx-auto h-8 w-8" />
                                            <p className="text-sm">No hay clientes registrados.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                            
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">O introducir teléfono para un nuevo cliente</h3>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="phone"
                                        value={clientPhoneInput}
                                        onChange={(e) => setClientPhoneInput(e.target.value)}
                                        placeholder="Número de teléfono ficticio"
                                    />
                                    <Button onClick={() => handleSetClient(clientPhoneInput)} disabled={!clientPhoneInput}>Guardar</Button>
                                </div>
                            </div>
                        </div>
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
                  <ChatMessages messages={messages} isLoading={isLoading} />
              </TabsContent>
              <TabsContent value="debug" className="flex-1 overflow-y-auto m-0">
                  <DebugView events={debugEvents} />
              </TabsContent>
          </div>
          <footer className="border-t bg-card/50 p-2 md:p-4">
              <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} isLocked={isChatLocked} />
          </footer>
        </Tabs>
      </div>
    </>
  );
}
