import { BarChart3 } from "lucide-react";

export function SubjectAnalysisTable({ analysis }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 ml-2 text-teal-600" />
        تحلیل عملکرد بر اساس درس
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-right p-3 font-semibold text-gray-700">درس</th>
              <th className="text-right p-3 font-semibold text-gray-700">کل تست‌ها</th>
              <th className="text-right p-3 font-semibold text-gray-700">کل ساعات</th>
              <th className="text-right p-3 font-semibold text-gray-700">تعداد گزارش</th>
              <th className="text-right p-3 font-semibold text-gray-700">تعداد دانش‌آموز</th>
              <th className="text-right p-3 font-semibold text-gray-700">میانگین تست</th>
              <th className="text-right p-3 font-semibold text-gray-700">بازدهی</th>
            </tr>
          </thead>
          <tbody>
            {analysis.map((subject, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3 text-gray-800 font-semibold">{subject.subject}</td>
                <td className="p-3 text-gray-600">{subject.totalTests}</td>
                <td className="p-3 text-gray-600">{subject.totalHours}</td>
                <td className="p-3 text-gray-600">{subject.reportCount}</td>
                <td className="p-3 text-gray-600">{subject.studentCount}</td>
                <td className="p-3 text-gray-600">{subject.avgTestsPerReport}</td>
                <td className="p-3 text-gray-600 font-semibold">{subject.efficiency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
