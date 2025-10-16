"use client";

import { useState } from "react";
import { useSession } from "@auth/create/react";
import { useNavigate } from "react-router-dom";
import { Image, Link as LinkIcon, FileText, Plus, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function ContentManagementPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: ""
  });
  
  const [creating, setCreating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.imageUrl.trim()) {
      alert("عنوان و تصویر الزامی هستند");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ محتوا با موفقیت ایجاد شد");
        // Reset form
        setFormData({
          title: "",
          description: "",
          imageUrl: "",
          linkUrl: ""
        });
      } else {
        alert("❌ " + (data.error || "خطا در ایجاد محتوا"));
      }
    } catch (err) {
      console.error("Error creating content:", err);
      alert("❌ خطا در ایجاد محتوا");
    } finally {
      setCreating(false);
    }
  };

  // Check admin access
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">فقط مدیر به این صفحه دسترسی دارد</p>
      </div>
    );
  }

  return (
    <AdminLayout current="content">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">ایجاد محتوای جدید</h1>
            <p className="text-purple-50 mt-1">محتوای آموزشی، اطلاعیه یا محتوای انگیزشی منتشر کنید</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline ml-2" />
                عنوان محتوا *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="مثال: راهنمای موفقیت در کنکور"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline ml-2" />
                توضیحات (اختیاری)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="توضیحات کامل درباره این محتوا..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline ml-2" />
                URL تصویر *
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                لینک مستقیم به تصویر (JPG, PNG یا GIF)
              </p>
              
              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="mt-3 border border-gray-200 rounded-lg p-2">
                  <p className="text-xs text-gray-600 mb-2">پیش‌نمایش:</p>
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline ml-2" />
                لینک خارجی (اختیاری)
              </label>
              <input
                type="url"
                name="linkUrl"
                onChange={handleInputChange}
                placeholder="https://example.com/article"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                اگر می‌خواهید کاربران با کلیک روی "مشاهده" به صفحه خاصی هدایت شوند
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={creating}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  creating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg"
                }`}
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ایجاد...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>انتشار محتوا</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 نکات مهم:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>محتوای شما برای تمام دانش‌آموزان قابل مشاهده خواهد بود</li>
            <li>تصویر باید با کیفیت مناسب و واضح باشد</li>
            <li>عنوان باید جذاب و توصیفی باشد</li>
            <li>در صورت تمایل می‌توانید لینک به ویدیو، مقاله یا منبع خارجی اضافه کنید</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}


