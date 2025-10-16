import { Target } from "lucide-react";

export default function ChallengesPanel({ challenges, onParticipate }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">چالش‌های فعال</h2>
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">چالش فعالی وجود ندارد</p>
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-gray-800 mb-2">
                {challenge.title}
              </h3>
              {challenge.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {challenge.description}
                </p>
              )}

              <div className="text-xs text-gray-500 mb-3">
                {challenge.start_date} تا {challenge.end_date}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-600">مشارکت من: </span>
                  <span className="font-semibold text-teal-600">
                    {challenge.my_completed_count || 0} روز
                  </span>
                </div>

                <button
                  onClick={() => onParticipate(challenge.id)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-md hover:from-green-600 hover:to-emerald-600 transition-all duration-200 text-sm"
                >
                  ✓ انجام دادم
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
