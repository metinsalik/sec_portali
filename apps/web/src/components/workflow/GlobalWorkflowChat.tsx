import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, Paperclip, Loader2, ArrowLeft } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, BASE_URL } from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { io, Socket } from 'socket.io-client';

// Read Counts Logic (LocalStorage)
const getReadCount = (taskId: string, username?: string) => {
  try {
    const data = localStorage.getItem('chat_reads');
    if (data && username) {
      const counts = JSON.parse(data);
      return counts[`${taskId}_${username}`] || 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

const updateReadCount = (taskId: string, count: number, username?: string) => {
  try {
    if (!username) return;
    const data = localStorage.getItem('chat_reads');
    const counts = data ? JSON.parse(data) : {};
    counts[`${taskId}_${username}`] = count;
    localStorage.setItem('chat_reads', JSON.stringify(counts));
  } catch {}
};

export default function GlobalWorkflowChat() {
  const { isChatOpen, activeTaskId, closeChat, openChat, setHasUnread } = useChat();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [chatValue, setChatValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['workflow', 'users'],
    queryFn: async () => {
      const res = await api.get('/workflow/users');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Fetch user tasks for the list view
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['workflow', 'tasks'],
    queryFn: async () => {
      const res = await api.get('/workflow/tasks');
      if (!res.ok) throw new Error('Görevler yüklenemedi');
      return res.json();
    }
  });

  // Check total unread messages on load
  useEffect(() => {
    if (tasks && Array.isArray(tasks)) {
      let hasAnyUnread = false;
      for (const t of tasks) {
        const totalMsgCount = t._count?.chatMessages || 0;
        const readMsgCount = getReadCount(t.id, user?.username);
        const unreadCount = Math.max(0, totalMsgCount - readMsgCount);
        if (unreadCount > 0) {
          hasAnyUnread = true;
          break;
        }
      }
      
      setHasUnread(hasAnyUnread && !isChatOpen);
    }
  }, [tasks, isChatOpen, setHasUnread]);

  // Fetch task info
  const { data: activeTask, isLoading: taskLoading } = useQuery({
    queryKey: ['workflow', 'tasks', activeTaskId],
    queryFn: async () => {
      const res = await api.get(`/workflow/tasks/${activeTaskId}`);
      if (!res.ok) throw new Error('Görev yüklenemedi');
      return res.json();
    },
    enabled: isChatOpen && !!activeTaskId,
  });

  // Fetch messages for the active task
  const { data: chatMessages, isLoading: chatLoading } = useQuery({
    queryKey: ['workflow', 'tasks', activeTaskId, 'chat'],
    queryFn: async () => {
      const res = await api.get(`/workflow/tasks/${activeTaskId}/chat`);
      if (!res.ok) throw new Error('Sohbet yüklenemedi');
      return res.json();
    },
    enabled: isChatOpen && !!activeTaskId,
  });

  // Setup Socket
  useEffect(() => {
    const s = io(BASE_URL || '/');
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Global listener for unread badge
    const onTaskUpdated = (updatedTaskId: any) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });
    };
    
    socket.on('task_updated', onTaskUpdated);
    
    return () => {
      socket.off('task_updated', onTaskUpdated);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    if (socket && activeTaskId) {
      socket.emit('joinTask', activeTaskId);
      
      const onTaskMessage = (newMsg: any) => {
        queryClient.setQueryData(['workflow', 'tasks', activeTaskId, 'chat'], (old: any) => {
          if (!old) return [newMsg];
          if (old.find((m: any) => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        });
      };
      
      socket.on('new_chat_message', onTaskMessage);
      
      return () => { 
        socket.off('new_chat_message', onTaskMessage); 
        socket.emit('leaveTask', activeTaskId); 
      };
    }
  }, [socket, activeTaskId, queryClient]);

  // Scroll to bottom
  useEffect(() => {
    if (activeTaskId && chatMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTaskId]);

  const sendChatMutation = useMutation({
    mutationFn: async ({ message, fileUrl, fileName }: { message?: string, fileUrl?: string, fileName?: string }) => {
      const res = await api.post(`/workflow/tasks/${activeTaskId}/chat`, { body: message, fileUrl, fileName });
      if (!res.ok) throw new Error('Mesaj gönderilemedi');
      return res.json();
    },
    onSuccess: (newMsg) => {
      // Socket will broadcast it, but we can optimistically update or just wait for socket
      setChatValue('');
    },
    onError: () => toast.error('Mesaj gönderilemedi')
  });

  const handleSendMessage = () => {
    if (!chatValue.trim()) return;
    sendChatMutation.mutate({ message: chatValue });
  };

  const handleChatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setChatValue(val);
    
    // Check for @ mention
    const match = val.match(/@([a-zA-Z0-9_\.]*)$/);
    if (match) {
      setMentionFilter(match[1]);
      setMentionOpen(true);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (username: string) => {
    const val = chatValue.replace(/@([a-zA-Z0-9_\.]*)$/, `@${username} `);
    setChatValue(val);
    setMentionOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.customFetch(`/workflow/tasks/${activeTaskId}/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Yükleme hatası');
      const data = await res.json();
      
      sendChatMutation.mutate({
        fileUrl: data.url,
        fileName: file.name
      });
    } catch (err) {
      toast.error('Dosya yüklenemedi');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  // Update read count when chat is opened and messages are loaded
  useEffect(() => {
    if (activeTaskId && chatMessages) {
      updateReadCount(activeTaskId, chatMessages.length, user?.username);
      setHasUnread(false);
    }
  }, [activeTaskId, chatMessages, setHasUnread, user?.username]);

  // Update read count when sending a message
  const onMessageSent = () => {
    if (activeTaskId && chatMessages) {
      updateReadCount(activeTaskId, chatMessages.length + 1, user?.username);
    }
  };

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90]" onClick={closeChat} />
      <div className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-slate-900 shadow-2xl z-[100] flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        <div className="h-16 border-b flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            {activeTaskId ? (
              <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => openChat(undefined)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            )}
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeTaskId ? (activeTask?.title || 'Sohbet') : 'Görev Sohbetleri'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={closeChat} className="shrink-0 -mr-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-950">
          {!activeTaskId ? (
            <div className="flex-1 overflow-y-auto p-2">
              {tasksLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : tasks?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">Göreviniz bulunmuyor.</div>
              ) : (
                <div className="space-y-1">
                  {tasks?.map((task: any) => {
                    const totalMsgCount = task._count?.chatMessages || 0;
                    const readMsgCount = getReadCount(task.id, user?.username);
                    const unreadCount = Math.max(0, totalMsgCount - readMsgCount);
                    return (
                      <div key={task.id} onClick={() => openChat(task.id)} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer transition-all flex flex-col gap-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm text-slate-900 dark:text-slate-100 truncate pr-2 ${unreadCount > 0 ? 'font-bold' : ''}`}>{task.title}</span>
                          {unreadCount > 0 && <span className="w-5 h-5 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center shrink-0">{unreadCount}</span>}
                        </div>
                        <span className="text-xs text-slate-500 truncate">Görevi Yapan: {task.assignee?.fullName || task.assignee?.username || 'Atanmadı'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {taskLoading || chatLoading ? (
                   <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : (
                  <>
                    {chatMessages?.map((msg: any, idx: number) => {
                      const isMe = msg.sender?.username === user?.username || msg.senderId === user?.username;
                      return (
                        <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="text-[10px] text-slate-500 mb-1 px-1">
                            {!isMe && <span className="font-medium">{msg.sender?.fullName || msg.sender?.username || msg.senderId} • </span>}
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </div>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'}`}>
                            {msg.body && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>}
                            {msg.fileUrl && (
                              <a href={`${BASE_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer" className={`text-xs flex items-center gap-1.5 p-2 mt-1 rounded bg-black/10 hover:bg-black/20 transition-colors ${!msg.body && 'mt-0'}`}>
                                <Paperclip className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[200px]">{msg.fileName || 'Dosya'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 border-t flex items-end gap-2 shrink-0">
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-slate-500 hover:text-slate-700" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </Button>
                <div className="flex-1 relative">
                  {mentionOpen && (
                    <div className="absolute bottom-full mb-1 left-0 w-64 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden z-[101]">
                      <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                        {users.filter((u: any) => u.username.toLowerCase().includes(mentionFilter.toLowerCase()) || u.fullName?.toLowerCase().includes(mentionFilter.toLowerCase())).map((u: any) => (
                          <div key={u.username} onClick={() => insertMention(u.username)} className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{u.fullName || u.username}</div>
                            <div className="text-xs text-slate-500">@{u.username}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Input
                    placeholder="Bir mesaj yazın (Etiketlemek için @)..."
                    value={chatValue}
                    onChange={handleChatChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (mentionOpen) {
                          const filtered = users.filter((u: any) => u.username.toLowerCase().includes(mentionFilter.toLowerCase()) || u.fullName?.toLowerCase().includes(mentionFilter.toLowerCase()));
                          if (filtered.length > 0) insertMention(filtered[0].username);
                        } else {
                          handleSendMessage();
                        }
                      }
                    }}
                    className="pr-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-indigo-500 h-10"
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1 top-1 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                    onClick={handleSendMessage}
                    disabled={!chatValue.trim() || sendChatMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
