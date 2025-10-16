import { Search, Trash2 } from "lucide-react";

export function ReportsTable({
  reports,
  searchTerm,
  setSearchTerm,
  sortField,
  sortDirection,
  handleSort,
  deleteReport,
  clearAllData,
}) {
  const SortableHeader = ({ field, label }) => (
    <th
      className="text-right p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      {label}{" "}
      {sortField === field && (sortDirection === "asc" ? "↑" : "↓")}
    </th>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
          لیست گزارش‌ها
        </h2>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={clearAllData}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            پاک کردن همه
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <SortableHeader field="date" label="تاریخ" />
              <SortableHeader field="subject" label="درس" />
              <SortableHeader field="testSource" label="منبع تست" />
              <SortableHeader field="testCount" label="تعداد تست" />
              <SortableHeader field="studyDuration" label="زمان مطالعه (ساعت)" />
              <th className="text-right p-3 font-semibold text-gray-700">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-gray-100 hover:bg-gray-50 animate-fadeIn"
              >
                <td className="p-3 text-gray-800">{report.date}</td>
                <td className="p-3 text-gray-800">{report.subject}</td>
                <td className="p-3 text-gray-600">{report.testSource}</td>
                <td className="p-3 text-gray-600">{report.testCount}</td>
                <td className="p-3 text-gray-600">
                  {(parseFloat(report.studyDuration) / 60).toFixed(1)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "گزارشی یافت نشد" : "هنوز گزارشی ثبت نشده است"}
          </div>
        )}
      </div>
    </div>
  );
}
