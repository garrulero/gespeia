"use client";

import type { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

type DebugViewProps = {
  messages: Message[];
  errors: any[];
};

export function DebugView({ messages, errors }: DebugViewProps) {
  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <pre className="text-sm">
              {JSON.stringify(messages, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
          {errors.length > 0 ? (
             <Accordion type="single" collapsible className="w-full">
                {errors.map((error, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{error.timestamp}: {error.message}</AccordionTrigger>
                        <AccordionContent>
                            <pre className="text-sm bg-muted p-2 rounded-md">
                                {JSON.stringify(error, null, 2)}
                            </pre>
                        </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
          ) : (
            <p className="text-sm text-muted-foreground">No errors have occurred.</p>
          )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}