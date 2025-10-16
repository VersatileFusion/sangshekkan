import { Save, X } from "lucide-react";

export function FeedbackModal({
  isOpen,
  onClose,
  report,
  status,
  setStatus,
  feedbackText,
  setFeedbackText,
  onSubmit,
}) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">بازخورد گزارش</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">جزئیات گزارش</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-600">دانش‌آموز:</span><span className="font-medium mr-2">{report.student_name}</span></div>
              <div><span className="text-gray-600">تاریخ:</span><span className="font-medium mr-2">{new Date(report.date).toLocaleDateString("fa-IR")}</span></div>
              <div><span className="text-gray-600">درس:</span><span className="font-medium mr-2">{report.subject}</span></div>
              <div><span className="text-gray-600">تعداد تست:</span><span className="font-medium mr-2">{report.test_count}</span></div>
              <div><span className="text-gray-600">زمان مطالعه:</span><span className="font-medium mr-2">{(report.study_duration / 60).toFixed(1)} ساعت</span></div>
              <div><span className="text-gray-600">تراز قلمچی:</span><span className="font-medium mr-2">{report.ghalamchi_score || "—"}</span></div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">وضعیت گزارش</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="pending">در انتظار بررسی</option>
              <option value="approved">تایید</option>
              <option value="rejected">رد</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">بازخورد برای دانش‌آموز</label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows="6"
              placeholder="بازخورد خود را برای این گزارش بنویسید..."
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSubmit}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center"
            >
              <Save className="w-5 h-5 ml-2" />
              ثبت بازخورد
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
