
"use client";

import ChatInterface from '@/components/chat/chat-interface';
import BeverageManager from '@/components/beverages/beverage-manager';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LayoutMode } from '@/lib/types';
import LayoutSwitcher from '@/components/layout/layout-switcher';


export default function Home() {
  const [layout, setLayout] = useState<LayoutMode>('split');

  return (
    <div className="relative h-screen w-screen">
      <div className="absolute top-2 right-2 z-10">
        <LayoutSwitcher layout={layout} onLayoutChange={setLayout} />
      </div>
      <div className={cn(
        "grid h-full w-full transition-all duration-300",
        layout === 'split' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
      )}>
        <div className={cn("h-screen overflow-y-auto border-r bg-slate-50", {
          "hidden": layout === 'chat',
          "block": layout === 'app' || layout === 'split',
        })}>
          <BeverageManager />
        </div>
        <div className={cn("h-screen", {
          "hidden": layout === 'app',
          "block": layout === 'chat' || layout === 'split',
        })}>
          <ChatInterface onLayoutChange={setLayout} />
        </div>
      </div>
    </div>
  );
}
