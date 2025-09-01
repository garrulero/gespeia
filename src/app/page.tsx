import ChatInterface from '@/components/chat/chat-interface';
import BeverageManager from '@/components/beverages/beverage-manager';

export default function Home() {
  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-2">
      <div className="h-screen overflow-y-auto border-r bg-slate-50">
        <BeverageManager />
      </div>
      <div className="h-screen">
        <ChatInterface />
      </div>
    </div>
  );
}
