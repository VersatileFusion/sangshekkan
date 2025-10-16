"use client";

import { useEffect, useState } from "react";
import { useSession } from "@auth/create/react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Trash2, Shield, Plus, X } from "lucide-react";

export default function ChatManagementPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [profanities, setProfanities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages"); // messages | profanity
  const [newWord, setNewWord] = useState("");
  const [addingWord, setAddingWord] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      navigate("/account/signin");
      return;
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      navigate("/");
      return;
    }

    fetchData();
  }, [session, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchMessages(), fetchProfanities()]);
    setLoading(false);
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages?type=public&limit=100&includeHidden=true");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchProfanities = async () => {
    try {
      const response = await fetch("/api/profanities");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfanities(data.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching profanities:", err);
    }
  };

  const handleHideMessage = async (messageId) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پیام را مخفی کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}/hide`, {
        method: "PATCH"
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ پیام مخفی شد");
        fetchMessages();
      } else {
        alert("❌ " + (data.error || "خطا در مخفی کردن پیام"));
      }
    } catch (err) {
      console.error("Error hiding message:", err);
      alert("❌ خطا در مخفی کردن پیام");
    }
  };

  const handleAddProfanity = async (e) => {
    e.preventDefault();
    
    if (!newWord.trim()) return;

    setAddingWord(true);

    try {
      const response = await fetch("/api/profanities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord.trim() })
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ کلمه اضافه شد");
        setNewWord("");
        fetchProfanities();
      } else {
        alert("❌ " + (data.error || "خطا در افزودن کلمه"));
      }
    } catch (err) {
      console.error("Error adding profanity:", err);
      alert("❌ خطا در افزودن کلمه");
    } finally {
      setAddingWord(false);
    }
  };

  const handleDeleteProfanity = async (id, word) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید کلمه "${word}" را حذف کنید؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profanities/${id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ کلمه حذف شد");
        fetchProfanities();
      } else {
        alert("❌ " + (data.error || "خطا در حذف کلمه"));
      }
    } catch (err) {
      console.error("Error deleting profanity:", err);
      alert("❌ خطا در حذف کلمه");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-teal-500" />
          مدیریت چت و کلمات نامناسب
        </h1>
        <p className="text-gray-600 mt-1">مدیریت پیام‌ها و فیلتر محتوا</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "messages"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          پیام‌ها ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab("profanity")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "profanity"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          کلمات نامناسب ({profanities.length})
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">لیست پیام‌های عمومی</h2>
          
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">هیچ پیامی وجود ندارد</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border rounded-lg p-4 ${
                    msg.status === "hidden" ? "bg-red-50 border-red-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm">{msg.senderName || "ناشناس"}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString("fa-IR")}
                        </span>
                        {msg.status === "hidden" && (
                          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            مخفی شده
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    
                    {msg.status === "visible" && (
                      <button
                        onClick={() => handleHideMessage(msg.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                      >
                        <EyeOff className="w-4 h-4" />
                        مخفی کردن
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profanity Tab */}
      {activeTab === "profanity" && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">مدیریت کلمات نامناسب</h2>
          
          {/* Add New Word */}
          <form onSubmit={handleAddProfanity} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              افزودن کلمه جدید
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="کلمه نامناسب را وارد کنید..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                disabled={addingWord}
              />
              <button
                type="submit"
                disabled={!newWord.trim() || addingWord}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {addingWord ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                افزودن
              </button>
            </div>
          </form>

          {/* List */}
          {profanities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">هیچ کلمه‌ای تعریف نشده است</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {profanities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <span className="font-medium text-sm">{item.word}</span>
                  <button
                    onClick={() => handleDeleteProfanity(item.id, item.word)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

