"use client";

import { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AlertCircle, Bot, Code, Cog, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

export type Event = {
  timestamp: string;
  type: 'info' | 'error' | 'input' | 'tool';
  message: string;
  data?: any;
};

type DebugViewProps = {
  events: Event[];
};

const iconMap = {
  info: <Bot className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4 text-destructive" />,
  input: <Code className="h-4 w-4 text-blue-500" />,
  tool: <Cog className="h-4 w-4 text-amber-500" />,
}

export function DebugView({ events }: DebugViewProps) {
  const { toast } = useToast();
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const rawInputs = sortedEvents.filter(e => e.type === 'input');
  const toolAndErrorEvents = sortedEvents.filter(e => e.type === 'tool' || e.type === 'error' || e.type === 'info');

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Raw AI Input</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
          {rawInputs.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
                {rawInputs.map((input, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            {iconMap[input.type]}
                            {new Date(input.timestamp).toLocaleTimeString()}: {input.message}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <pre className="text-sm bg-muted p-2 rounded-md overflow-x-auto">
                                {JSON.stringify(input.data, null, 2)}
                            </pre>
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">No raw input to display.</p>
          )}
          </ScrollArea>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tool Calls, Events & Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
          {toolAndErrorEvents.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
                {toolAndErrorEvents.map((event, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            {iconMap[event.type]}
                            {new Date(event.timestamp).toLocaleTimeString()}: {event.message}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="relative group">
                                {event.type === 'error' && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const text = JSON.stringify(event.data, null, 2) || event.message;
                                            navigator.clipboard.writeText(text);
                                            toast({ title: "Error copiado", description: "El output se ha copiado al portapapeles." });
                                        }}
                                        title="Copiar error"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                )}
                                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto min-h-[3rem]">
                                    {JSON.stringify(event.data, null, 2) || event.message}
                                </pre>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">No tool calls or errors have occurred.</p>
          )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
