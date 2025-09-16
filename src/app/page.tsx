
"use client";

import ChatInterface from '@/components/chat/chat-interface';
import BeverageManager from '@/components/beverages/beverage-manager';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { LayoutMode } from '@/lib/types';
import LayoutSwitcher from '@/components/layout/layout-switcher';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function Home() {
  const [layout, setLayout] = useState<LayoutMode>('split');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(true);

  return (
    <>
      <AlertDialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Bienvenido a la aplicación de demostración!</AlertDialogTitle>
            <AlertDialogDescription>
              Esta es una versión de demostración. Los datos que añadas (clientes, productos, pedidos) se guardan solo para tu sesión actual. Si la aplicación se reinicia, todos los datos se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDemoModalOpen(false)}>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center justify-center border-b bg-primary px-4 py-3 text-primary-foreground shadow-md">
        <LayoutSwitcher layout={layout} onLayoutChange={setLayout} />
      </header>
      <main className="flex-1 overflow-hidden">
        <div className={cn(
          "grid h-full w-full transition-all duration-300",
          layout === 'split' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}>
          <div className={cn("h-full overflow-y-auto border-r bg-slate-50", {
            "hidden": layout === 'chat',
            "block": layout === 'app' || layout === 'split',
          })}>
            <BeverageManager />
          </div>
          <div className={cn("h-full overflow-y-auto", {
            "hidden": layout === 'app',
            "block": layout === 'chat' || layout === 'split',
          })}>
            <ChatInterface onLayoutChange={setLayout} />
          </div>
        </div>
      </main>
    </>
  );
}
