import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  activeTaskId: string | null;
  openChat: (taskId?: string) => void;
  closeChat: () => void;
  hasUnread: boolean;
  setHasUnread: (val: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const openChat = (taskId?: string) => {
    if (taskId !== undefined) {
      setActiveTaskId(taskId);
    } else {
      setActiveTaskId(null); // Open list view
    }
    setHasUnread(false);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setTimeout(() => setActiveTaskId(null), 300); // Wait for transition
  };

  return (
    <ChatContext.Provider value={{ isChatOpen, activeTaskId, openChat, closeChat, hasUnread, setHasUnread }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
