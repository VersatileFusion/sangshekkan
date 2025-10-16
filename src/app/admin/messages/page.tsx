"use client";

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { MessageSquare, Send, Trash2, User, Loader, AlertCircle } from 'lucide-react';

interface Conversation {
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  type: 'private' | 'public';
}

interface Message {
  id: string;
  content: string;
  type: 'private' | 'public';
  senderId: string;
  senderName: string | null;
  senderRole: string | null;
  senderAvatarUrl: string | null;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    role: string;
    profileImageUrl: string | null;
  };
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.studentId);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // Auto-select first conversation
        if (data.conversations && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      } else {
        setError('خطا در دریافت مکالمات');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (studentId: string) => {
    try {
      const response = await fetch(`/api/messages/conversation/${studentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error('Failed to fetch messages');
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      setError('');

      // Different endpoint for public vs private messages
      const endpoint = selectedConversation.type === 'public' 
        ? '/api/messages/public/admin'
        : '/api/messages/admin-reply';

      const body = selectedConversation.type === 'public'
        ? { content: newMessage.trim() }
        : { studentId: selectedConversation.studentId, messageContent: newMessage.trim() };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add new message to the list
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'خطا در ارسال پیام');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پیام را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/public/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove message from list
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'خطا در حذف پیام');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('خطا در حذف پیام');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  if (loading) {
    return (
      <AdminLayout current="dashboard">
        <div className="flex items-center justify-center py-20">
          <Loader className="w-16 h-16 text-purple-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout current="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            مدیریت پیام‌ها و مکالمات
          </h1>
          <p className="text-gray-600 mt-1">مشاهده و پاسخ به پیام‌های خصوصی و مدیریت چت عمومی</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-purple-50 border-b border-purple-100">
              <h2 className="font-bold text-gray-800">مکالمات ({conversations.length})</h2>
            </div>
            
            <div className="overflow-y-auto max-h-[600px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>هیچ مکالمه‌ای وجود ندارد</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.studentId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedConversation?.studentId === conv.studentId
                        ? 'bg-purple-50 border-purple-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {conv.studentAvatar ? (
                          <img
                            src={conv.studentAvatar}
                            alt={conv.studentName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                            {conv.type === 'public' ? (
                              <MessageSquare className="w-5 h-5 text-purple-700" />
                            ) : (
                              <User className="w-5 h-5 text-purple-700" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conv.studentName}
                          </h3>
                          {conv.type === 'public' && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              عمومی
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(conv.lastMessageTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Chat View */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col" style={{ height: '700px' }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
                  {selectedConversation.studentAvatar ? (
                    <img
                      src={selectedConversation.studentAvatar}
                      alt={selectedConversation.studentName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                      {selectedConversation.type === 'public' ? (
                        <MessageSquare className="w-5 h-5 text-purple-700" />
                      ) : (
                        <User className="w-5 h-5 text-purple-700" />
                      )}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-gray-900">{selectedConversation.studentName}</h2>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.type === 'public' ? 'چت عمومی - فقط مشاهده و حذف' : 'مکالمه خصوصی'}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>هیچ پیامی وجود ندارد</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender.role === 'ADMIN';
                      const isPublicChat = selectedConversation.type === 'public';
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isAdmin
                                ? isPublicChat
                                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                                  : 'bg-purple-500 text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold">
                                {msg.sender.name || 'بدون نام'}
                              </span>
                              {msg.sender.role === 'ADMIN' && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                  isPublicChat 
                                    ? 'bg-yellow-400 text-purple-900' 
                                    : 'bg-purple-700 text-white'
                                }`}>
                                  {isPublicChat ? '👑 مدیر' : 'ادمین'}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2 gap-3">
                              <span className={`text-xs ${isAdmin ? 'text-purple-200' : 'text-gray-500'}`}>
                                {formatTime(msg.createdAt)}
                              </span>
                              
                              {/* Delete button for public messages from students */}
                              {selectedConversation.type === 'public' && !isAdmin && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 hover:underline"
                                  title="حذف پیام"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  حذف
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border-t border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Input Area - Now works for both public and private */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder={selectedConversation.type === 'public' ? 'پیام عمومی خود را بنویسید...' : 'پیام خود را بنویسید...'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {sending ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      ارسال
                    </button>
                  </div>
                  {selectedConversation.type === 'public' && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      پیام شما در چت عمومی برای همه دانش‌آموزان قابل مشاهده است
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>یک مکالمه را انتخاب کنید</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

