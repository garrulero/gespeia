"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { ChatAvatar } from "./chat-avatar";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useState } from "react";
import { getAlternativeResponses } from "@/app/actions";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ChatMessageProps = {
  message: Message;
  isLoading?: boolean;
  onUpdateMessage?: (messageId: string, newContent: string) => void;
};

export function ChatMessage({ message, isLoading = false, onUpdateMessage }: ChatMessageProps) {
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isFetchingAlternatives, setIsFetchingAlternatives] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  const handleFetchAlternatives = async () => {
    if (alternatives.length > 0) return;
    setIsFetchingAlternatives(true);
    const result = await getAlternativeResponses(message.content);
    if (result.success && result.alternatives) {
      setAlternatives(result.alternatives);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Could not fetch alternatives."
        })
        setPopoverOpen(false);
    }
    setIsFetchingAlternatives(false);
  };

  const handleSelectAlternative = (alt: string) => {
    if (onUpdateMessage) {
      onUpdateMessage(message.id, alt);
    }
    setPopoverOpen(false);
  };
  
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

          {!isUser && !isLoading && onUpdateMessage && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-10 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleFetchAlternatives}
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Alternative Responses</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose a different response.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {isFetchingAlternatives ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      alternatives.map((alt, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="h-auto justify-start text-left whitespace-normal"
                          onClick={() => handleSelectAlternative(alt)}
                        >
                          {alt}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {isUser && <ChatAvatar role="user" />}
    </div>
  );
}
