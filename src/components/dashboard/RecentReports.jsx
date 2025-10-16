import { Plus, Trash2, FileText } from "lucide-react";

export default function RecentReports({
  reports = [],
  onDeleteReport,
  onAddNewReport,
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">گزارش‌های اخیر</h2>
        <button
          onClick={onAddNewReport}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span className="mr-2">ثبت گزارش جدید</span>
        </button>
      </div>

      <div className="space-y-4">
        {!reports || reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">هنوز گزارشی ثبت نکرده‌اید</p>
            <button
              onClick={onAddNewReport}
              className="mt-4 text-teal-600 hover:text-teal-700 font-semibold"
            >
              اولین گزارش خود را ثبت کنید
            </button>
          </div>
        ) : (
          reports.slice(0, 5).map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                  {report.subject}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف گزارش"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : report.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {report.status === "approved" && "تایید شده"}
                    {report.status === "rejected" && "رد شده"}
                    {report.status === "pending" && "در انتظار بررسی"}
                  </span>
                  <span className="text-sm text-gray-500 mr-2">
                    {report.report_date}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">تست‌ها:</span>{" "}
                  {report.test_count}
                </div>
                <div>
                  <span className="font-medium">مدت:</span>{" "}
                  {report.study_duration} دقیقه
                </div>
                {report.ghalamchi_score && (
                  <div>
                    <span className="font-medium">تراز:</span>{" "}
                    {report.ghalamchi_score}
                  </div>
                )}
                {report.test_source && (
                  <div>
                    <span className="font-medium">منبع:</span>{" "}
                    {report.test_source}
                  </div>
                )}
              </div>

              {report.advisor_feedback && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>بازخورد مشاور:</strong> {report.advisor_feedback}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
