export default function DashboardHeader({ userName }) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        داشبورد دانش‌آموز
      </h1>
      <p className="text-gray-600">خوش آمدید، {userName}</p>
    </div>
  );
}
