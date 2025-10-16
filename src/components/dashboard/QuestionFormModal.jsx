import { useState, useRef } from "react";
import { X, Paperclip } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function QuestionFormModal({ show, onClose, onSubmit }) {
  const [questionData, setQuestionData] = useState({
    message: "",
    attachmentUrl: "",
  });

  const { uploading, uploadImage } = useImageUpload();
  const fileInputRef = useRef(null);
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setQuestionData((prev) => ({ ...prev, attachmentUrl: url }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(questionData);
    if (success) {
      setQuestionData({ message: "", attachmentUrl: "" });
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">❓ سوال خود را بپرسید<span className="ml-2 text-xl">💬</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
          </div>
          <p className="text-pink-100 mt-2">🎯 مشاور شما در اسرع وقت پاسخ خواهد داد</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">💬 متن سوال *</label>
            <textarea
              value={questionData.message}
              onChange={(e) => setQuestionData({ ...questionData, message: e.target.value })}
              rows="6"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm"
              placeholder="سوال خود را به تفصیل بنویسید..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">📎 ضمیمه تصویر (اختیاری)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
              {questionData.attachmentUrl ? (
                <div className="space-y-4">
                  <img src={questionData.attachmentUrl} alt="ضمیمه" className="w-32 h-32 object-cover rounded-lg mx-auto shadow-md" />
                  <div className="flex gap-2 justify-center">
                    <button type="button" onClick={() => setQuestionData({ ...questionData, attachmentUrl: "" })} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm">حذف ضمیمه</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">تغییر تصویر</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto"><Paperclip className="w-8 h-8 text-gray-400" /></div>
                  <div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50">
                      {uploading ? "در حال آپلود..." : "📎 انتخاب تصویر"}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">برای توضیح بهتر سوال، تصویر ضمیمه کنید</p>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-200">انصراف</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg">📤 ارسال سوال</button>
          </div>
        </form>
      </div>
    </div>
  );
}
