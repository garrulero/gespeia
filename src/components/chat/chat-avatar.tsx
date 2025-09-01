import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { GeminiLogo } from "../icons/gemini-logo";

type ChatAvatarProps = {
  role: 'user' | 'assistant';
};

export function ChatAvatar({ role }: ChatAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", { "bg-primary text-primary-foreground": role === 'assistant' })}>
      {role === 'assistant' ? (
        <AvatarFallback className="bg-primary text-primary-foreground">
            <GeminiLogo className="h-5 w-5" />
        </AvatarFallback>
      ) : (
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      )}
    </Avatar>
  );
}
