
"use client";

import ChatInterface from '@/components/chat/chat-interface';
import BeverageManager from '@/components/beverages/beverage-manager';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LayoutMode } from '@/lib/types';


export default function Home() {
  const [layout, setLayout] = useState<LayoutMode>('split');

  return (
    <div className={cn(
      "grid h-screen transition-all duration-300",
      layout === 'split' && "grid-cols-1 md:grid-cols-2",
      (layout === 'app' || layout === 'chat') && "grid-cols-1"
    )}>
      <div className={cn("h-screen overflow-y-auto border-r bg-slate-50", {
        "hidden md:block": layout === 'chat',
        "block": layout === 'app' || layout === 'split',
      })}>
        <BeverageManager />
      </div>
      <div className={cn("h-screen", {
        "hidden md:block": layout === 'app',
        "block": layout === 'chat' || layout === 'split',
      })}>
        <ChatInterface layout={layout} onLayoutChange={setLayout} />
      </div>
    </div>
  );
}
