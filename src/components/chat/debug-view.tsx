"use client";

import type { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

type DebugViewProps = {
  messages: Message[];
  errors: any[];
  rawInputs: any[];
};

export function DebugView({ messages, errors, rawInputs }: DebugViewProps) {
  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <pre className="text-sm">
              {JSON.stringify(messages, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
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
                        <AccordionTrigger>{input.timestamp}: {input.message}</AccordionTrigger>
                        <AccordionContent>
                            <pre className="text-sm bg-muted p-2 rounded-md">
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
          <CardTitle>Tool Calls & Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
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
            <p className="text-sm text-muted-foreground">No tool calls or errors have occurred.</p>
          )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
