
"use client";

import { Button } from "@/components/ui/button";
import { LayoutMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PanelLeft, PanelsTopLeft, PanelRight } from "lucide-react";

type LayoutSwitcherProps = {
    layout: LayoutMode;
    onLayoutChange: (mode: LayoutMode) => void;
};

export default function LayoutSwitcher({ layout, onLayoutChange }: LayoutSwitcherProps) {
    const layouts: { mode: LayoutMode; label: string; icon: React.ReactNode }[] = [
        { mode: 'app', label: 'Gestor', icon: <PanelLeft /> },
        { mode: 'split', label: 'Dividida', icon: <PanelsTopLeft /> },
        { mode: 'chat', label: 'Chat', icon: <PanelRight /> },
    ];
    
    return (
        <div className="flex items-center gap-1 rounded-lg bg-primary/20 p-1">
            {layouts.map((item) => (
                <Button
                    key={item.mode}
                    variant="ghost"
                    size="sm"
                    className={cn("h-8 text-primary-foreground/80 hover:text-primary-foreground", {
                        "bg-primary-foreground/10 text-primary-foreground shadow-sm": layout === item.mode,
                    })}
                    onClick={() => onLayoutChange(item.mode)}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </Button>
            ))}
        </div>
    )
}
