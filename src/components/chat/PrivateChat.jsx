"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@auth/create/react";
import { Send, User, Lock } from "lucide-react";

export default function PrivateChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [adminId, setAdminId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch admin ID and messages
  useEffect(() => {
    if (session?.user) {
      fetchAdminAndMessages();
      
      // Poll every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchAdminAndMessages = async () => {
    try {
      // Find admin to get their ID for private messages
      const adminResponse = await fetch("/api/users?role=ADMIN&limit=1");
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        if (adminData.users && adminData.users.length > 0) {
          setAdminId(adminData.users[0].id);
        }
      }
      
      await fetchMessages();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages?type=private&limit=50");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !adminId) return;

    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: "private",
          privateToUserId: adminId
        })
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error === "contains_profanity") {
          setError("⚠️ پیام شامل کلمات نامناسب است");
        } else {
          setError(data.message || "خطا در ارسال پیام");
        }
        return;
      }

      setNewMessage("");
      fetchMessages();
      
    } catch (err) {
      console.error("Send error:", err);
      setError("خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-500">برای مشاهده چت خصوصی لطفاً وارد شوید</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5" />
          پیام خصوصی به مدیر
        </h2>
        <p className="text-xs text-purple-50">گفتگوی محرمانه با مشاور</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50 to-pink-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
            <Lock className="w-12 h-12 mb-2 text-gray-300" />
            <p>هنوز پیامی ارسال نشده است</p>
            <p className="text-xs mt-1">اولین پیام خود را به مشاور ارسال کنید</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId === session?.user?.id;
            const isFromAdmin = msg.senderRole === "ADMIN";
            
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {msg.senderAvatarUrl ? (
                  <img
                    src={msg.senderAvatarUrl}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    alt={msg.senderName || "User"}
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${
                    isFromAdmin 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-teal-500 to-cyan-500'
                  } flex items-center justify-center text-white text-sm flex-shrink-0`}>
                    {msg.senderName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="text-xs text-gray-500 mb-1">
                    {isFromAdmin ? "🌟 " : ""}{msg.senderName || "کاربر"} • {formatTime(msg.createdAt)}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg shadow-sm ${
                      isOwnMessage
                        ? 'bg-teal-500 text-white rounded-br-none'
                        : isFromAdmin
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-bl-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white rounded-b-xl">
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
        
        {!adminId && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            ⚠️ در حال یافتن مشاور...
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="پیام خصوصی به مشاور..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            maxLength={2000}
            disabled={sending || !adminId}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !adminId}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">ارسال</span>
              </>
            )}
          </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          پیام‌های شما فقط برای مشاور قابل مشاهده است
        </p>
      </form>
    </div>
  );
}

