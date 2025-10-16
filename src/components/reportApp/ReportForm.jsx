import { useState } from "react";
import { Plus } from "lucide-react";

export function ReportForm({ onAddReport }) {
  const [formData, setFormData] = useState({
    date: "",
    subject: "",
    testSource: "",
    testCount: "",
    studyDuration: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedData = {
      date: formData.date.trim(),
      subject: formData.subject.trim(),
      testSource: formData.testSource.trim(),
      testCount: formData.testCount.trim(),
      studyDuration: formData.studyDuration.trim(),
    };

    if (
      !trimmedData.date ||
      !trimmedData.subject ||
      !trimmedData.testSource ||
      !trimmedData.testCount ||
      !trimmedData.studyDuration
    ) {
      alert("لطفاً همه فیلدها را پر کنید");
      return;
    }

    const testCount = parseInt(trimmedData.testCount);
    const studyDuration = parseFloat(trimmedData.studyDuration);

    if (isNaN(testCount) || testCount <= 0) {
      alert("تعداد تست باید یک عدد مثبت باشد");
      return;
    }

    if (isNaN(studyDuration) || studyDuration <= 0) {
      alert("مدت زمان مطالعه باید یک عدد مثبت باشد");
      return;
    }

    const result = onAddReport({
      ...trimmedData,
      testCount: testCount.toString(),
      studyDuration: studyDuration.toString(),
    });
    
    if (result.success) {
      setFormData({
        date: "",
        subject: "",
        testSource: "",
        testCount: "",
        studyDuration: "",
      });
    } else if (result.message) {
      alert(result.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <Plus className="w-6 h-6 ml-2 text-teal-600" />
        ثبت گزارش جدید
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            تاریخ (شمسی)
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            نام درس
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="مثال: ریاضی"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            منبع تست
          </label>
          <input
            type="text"
            value={formData.testSource}
            onChange={(e) =>
              setFormData({ ...formData, testSource: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="مثال: کتاب تست"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            تعداد تست
          </label>
          <input
            type="number"
            value={formData.testCount}
            onChange={(e) =>
              setFormData({ ...formData, testCount: e.target.value })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            مدت زمان مطالعه (دقیقه)
          </label>
          <input
            type="number"
            value={formData.studyDuration}
            onChange={(e) =>
              setFormData({
                ...formData,
                studyDuration: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="0"
            min={0}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105"
        >
          ثبت گزارش
        </button>
      </form>
    </div>
  );
}
