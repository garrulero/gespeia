
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type LayoutMode = 'split' | 'app' | 'chat';
