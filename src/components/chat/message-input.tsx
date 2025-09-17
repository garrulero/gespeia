"use client";

import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem } from "../ui/form";

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type MessageInputProps = {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isLocked?: boolean;
};

export function MessageInput({ onSendMessage, isLoading, isLocked = false }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 144; // Corresponds to max-h-36
      if (scrollHeight > maxHeight) {
          textareaRef.current.style.height = `${maxHeight}px`;
          textareaRef.current.style.overflowY = 'auto';
      } else {
          textareaRef.current.style.height = `${scrollHeight}px`;
          textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSendMessage(values.message);
    form.reset();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.overflowY = 'hidden';
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        form.handleSubmit(onSubmit)();
    }
  };

  const isDisabled = isLoading || isLocked;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex items-start gap-2"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea
                  {...field}
                  ref={textareaRef}
                  placeholder={isLocked ? "Límite de mensajes alcanzado." : "Type your message..."}
                  rows={1}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  className="max-h-36 resize-none"
                  disabled={isDisabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" size="icon" disabled={isDisabled || !form.formState.isDirty || !form.formState.isValid}>
          <SendHorizontal className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </Form>
  );
}
