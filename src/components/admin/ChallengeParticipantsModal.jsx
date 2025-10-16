"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Users, 
  TrendingUp, 
  Star, 
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

export default function ChallengeParticipantsModal({ challengeId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedParticipant, setExpandedParticipant] = useState(null);

  useEffect(() => {
    fetchParticipants();
  }, [challengeId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      console.log('🔍 [Modal] Fetching participants for challenge:', challengeId);
      
      const response = await fetch(`/api/admin/challenges/${challengeId}/participations`, {
        credentials: 'include',
      });
      
      console.log('📥 [Modal] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Modal] Error response:', errorData);
        throw new Error(errorData.error || "خطا در دریافت اطلاعات");
      }

      const result = await response.json();
      console.log('✅ [Modal] Received data:', result);
      setData(result);
    } catch (err) {
      console.error("❌ [Modal] Fetch participants error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRatingEmoji = (rating) => {
    if (rating >= 4.5) return "🤩";
    if (rating >= 3.5) return "😄";
    if (rating >= 2.5) return "😊";
    if (rating >= 1.5) return "😐";
    return "😠";
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {data?.challenge?.title || "چالش"}
            </h2>
            <p className="text-teal-100 text-sm">
              لیست شرکت‌کنندگان و پیشرفت آن‌ها
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-10 h-10 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {data?.statistics?.totalParticipants || 0}
                      </div>
                      <div className="text-sm text-blue-700">شرکت‌کننده</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-10 h-10 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">
                        {data?.statistics?.averageProgress || 0}%
                      </div>
                      <div className="text-sm text-green-700">میانگین پیشرفت</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-10 h-10 text-yellow-600" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-900 flex items-center gap-1">
                        {data?.statistics?.averageRating || 0}
                        <span className="text-lg">{getRatingEmoji(data?.statistics?.averageRating || 0)}</span>
                      </div>
                      <div className="text-sm text-yellow-700">میانگین رضایت</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Table */}
              {data?.participants?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>هنوز هیچ دانش‌آموزی در این چالش شرکت نکرده است</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.participants?.map((participant) => (
                    <div
                      key={participant.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Participant Header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {participant.studentName?.charAt(0) || "؟"}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">
                                {participant.studentName || "نام نامشخص"}
                              </h4>
                              <div className="text-sm text-gray-600 flex items-center gap-3">
                                <span>{participant.studentGrade || ""}</span>
                                {participant.studentField && (
                                  <span>• {participant.studentField}</span>
                                )}
                              </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-6">
                              {/* Progress */}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600">
                                  {participant.progress}%
                                </div>
                                <div className="text-xs text-gray-500">پیشرفت</div>
                              </div>

                              {/* Days */}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-600 flex items-center gap-1">
                                  {participant.totalDays}
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div className="text-xs text-gray-500">روز فعال</div>
                              </div>

                              {/* Rating */}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                                  {participant.averageRating}
                                  <span className="text-lg">{getRatingEmoji(participant.averageRating)}</span>
                                </div>
                                <div className="text-xs text-gray-500">میانگین رضایت</div>
                              </div>

                              {/* Expand Button */}
                              <button
                                onClick={() => setExpandedParticipant(
                                  expandedParticipant === participant.id ? null : participant.id
                                )}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {expandedParticipant === participant.id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${getProgressColor(participant.progress)}`}
                              style={{ width: `${participant.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedParticipant === participant.id && participant.dailyProgress?.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            تاریخچه پیشرفت روزانه
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                            {participant.dailyProgress.map((progress) => (
                              <div
                                key={progress.id}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {new Date(progress.date).toLocaleDateString('fa-IR')}
                                  </span>
                                  <span className="text-2xl">
                                    {getRatingEmoji(progress.satisfactionRating)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm text-gray-600">
                                    امتیاز: {progress.satisfactionRating}/5
                                  </span>
                                </div>
                                {progress.notes && (
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {progress.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}

