
"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PanelLeft, PanelsTopLeft, PanelRight } from "lucide-react";

type LayoutSwitcherProps = {
    layout: LayoutMode;
    onLayoutChange: (mode: LayoutMode) => void;
};

export default function LayoutSwitcher({ layout, onLayoutChange }: LayoutSwitcherProps) {
    const layouts: { mode: LayoutMode; label: string; icon: React.ReactNode }[] = [
        { mode: 'app', label: 'Vista de gestor', icon: <PanelLeft /> },
        { mode: 'split', label: 'Vista dividida', icon: <PanelsTopLeft /> },
        { mode: 'chat', label: 'Vista de chat', icon: <PanelRight /> },
    ];
    
    return (
        <div className="flex items-center gap-1 rounded-lg bg-primary/20 p-1">
             <TooltipProvider delayDuration={200}>
                {layouts.map((item) => (
                    <Tooltip key={item.mode}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground", {
                                    "bg-primary-foreground/10 text-primary-foreground shadow-sm": layout === item.mode,
                                })}
                                onClick={() => onLayoutChange(item.mode)}
                            >
                                {item.icon}
                                <span className="sr-only">{item.label}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{item.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    )
}
