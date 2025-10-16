import { Search, Download } from "lucide-react";
import { ReportsTable } from "./ReportsTable";

export function ReportsManagement({
  reports,
  totalCount,
  searchTerm,
  setSearchTerm,
  filterSubject,
  setFilterSubject,
  filterStatus,
  setFilterStatus,
  uniqueSubjects,
  exportToCSV,
  sortField,
  sortDirection,
  handleSort,
  openFeedbackModal
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">
          مدیریت گزارش‌ها و بازخورد
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
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">همه دروس</option>
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تایید شده</option>
            <option value="rejected">رد شده</option>
          </select>
          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            <Download className="w-4 h-4 ml-2" />
            خروجی CSV
          </button>
        </div>
      </div>
      <div className="mb-4 text-sm text-gray-600">
        نمایش {reports.length} گزارش از {totalCount} گزارش کل
      </div>
      <ReportsTable
        reports={reports}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        openFeedbackModal={openFeedbackModal}
      />
    </div>
  );
}
