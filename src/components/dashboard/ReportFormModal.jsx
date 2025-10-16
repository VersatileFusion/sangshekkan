"use client";

import { useRef } from "react";
import { X, Camera } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

const subjects = [
  "ریاضی",
  "فیزیک",
  "شیمی",
  "زیست‌شناسی",
  "زبان انگلیسی",
  "ادبیات فارسی",
  "تاریخ",
  "جغرافیا",
  "عربی",
  "دینی",
];

export default function ReportFormModal({
  isOpen,
  onClose,
  onSubmit,
  reportForm,
  setReportForm,
  loading,
  error,
}) {
  const { uploading, uploadImage } = useImageUpload();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setReportForm((prev) => ({ ...prev, imageUrl: url }));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">ثبت گزارش جدید</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تاریخ *
              </label>
              <input
                type="date"
                value={reportForm.reportDate}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    reportDate: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                درس *
              </label>
              <select
                value={reportForm.subject}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">انتخاب درس</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              منبع تست
            </label>
            <input
              type="text"
              value={reportForm.testSource}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  testSource: e.target.value,
                }))
              }
              placeholder="نام کتاب، سایت یا منبع تست"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تعداد تست‌ها *
              </label>
              <input
                type="number"
                value={reportForm.testCount}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    testCount: e.target.value,
                  }))
                }
                placeholder="۰"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                مدت مطالعه (دقیقه) *
              </label>
              <input
                type="number"
                value={reportForm.studyDuration}
                onChange={(e) =>
                  setReportForm((prev) => ({
                    ...prev,
                    studyDuration: e.target.value,
                  }))
                }
                placeholder="۰"
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              تراز قلمچی (اختیاری)
            </label>
            <input
              type="number"
              value={reportForm.ghalamchiScore}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  ghalamchiScore: e.target.value,
                }))
              }
              placeholder="۰"
              min="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              توضیحات اضافی
            </label>
            <textarea
              value={reportForm.description}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="نکات، مشکلات یا توضیحات دیگر..."
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              آپلود تصویر (اختیاری)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
              {reportForm.imageUrl ? (
                <div className="space-y-3">
                  <img
                    src={reportForm.imageUrl}
                    alt="پیش‌نمایش"
                    className="w-24 h-24 object-cover rounded-lg mx-auto"
                  />
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setReportForm((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      حذف
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      تغییر
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 disabled:opacity-50 text-sm"
                  >
                    {uploading ? "در حال آپلود..." : "انتخاب تصویر"}
                  </button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF (حداکثر 5MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-200 mr-4"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "در حال ثبت..." : "ثبت گزارش"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
