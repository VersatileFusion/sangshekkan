export function SubjectStatsTable({ subjectStats }) {
  if (subjectStats.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        جدول ارزش داده‌ها
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-right p-3 font-semibold text-gray-700">
                درس
              </th>
              <th className="text-right p-3 font-semibold text-gray-700">
                جمع تست‌ها
              </th>
              <th className="text-right p-3 font-semibold text-gray-700">
                جمع ساعات
              </th>
              <th className="text-right p-3 font-semibold text-gray-700">
                ارزش داده‌ها
              </th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((stat, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="p-3 text-gray-800 font-medium">
                  {stat.subject}
                </td>
                <td className="p-3 text-gray-600">{stat.tests}</td>
                <td className="p-3 text-gray-600">{stat.hours}</td>
                <td className="p-3 text-gray-600 font-semibold">
                  {stat.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
