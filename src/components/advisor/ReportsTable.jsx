import { MessageSquare } from "lucide-react";

export function ReportsTable({ reports, sortField, sortDirection, handleSort, openFeedbackModal }) {
  const getSortIndicator = (field) => {
    if (sortField === field) {
      return sortDirection === "asc" ? "↑" : "↓";
    }
    return null;
  };

  const headers = [
    { key: "date", label: "تاریخ" },
    { key: "student_name", label: "دانش‌آموز" },
    { key: "subject", label: "درس" },
    { key: "test_count", label: "تست‌ها" },
    { key: "study_duration", label: "ساعت" },
    { key: null, label: "تراز" },
    { key: null, label: "وضعیت" },
    { key: null, label: "عملیات" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((header) => (
              <th
                key={header.key || header.label}
                className={`text-right p-3 font-semibold text-gray-700 ${header.key ? "cursor-pointer hover:bg-gray-100" : ""}`}
                onClick={() => header.key && handleSort(header.key)}
              >
                {header.label} {getSortIndicator(header.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="p-3 text-gray-800">{new Date(report.date).toLocaleDateString("fa-IR")}</td>
              <td className="p-3 text-gray-800 font-semibold">{report.student_name}</td>
              <td className="p-3 text-gray-800">{report.subject}</td>
              <td className="p-3 text-gray-600">{report.test_count}</td>
              <td className="p-3 text-gray-600">{(report.study_duration / 60).toFixed(1)}</td>
              <td className="p-3 text-gray-600">{report.ghalamchi_score || "—"}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  report.status === "approved" ? "bg-green-100 text-green-800"
                  : report.status === "rejected" ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
                }`}>
                  {report.status === "approved" ? "تایید شده" : report.status === "rejected" ? "رد شده" : "در انتظار"}
                </span>
              </td>
              <td className="p-3">
                <button
                  onClick={() => openFeedbackModal(report)}
                  className="bg-teal-500 text-white px-3 py-1 rounded-lg hover:bg-teal-600 transition-colors text-sm flex items-center"
                >
                  <MessageSquare className="w-4 h-4 ml-1" />
                  بازخورد
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {"گزارشی یافت نشد"}
        </div>
      )}
    </div>
  );
}
