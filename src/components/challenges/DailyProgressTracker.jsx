"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Calendar, TrendingUp, Loader2 } from "lucide-react";
import RatingInput from "./RatingInput";

export default function DailyProgressTracker({ challengeId, participation }) {
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [canSubmitToday, setCanSubmitToday] = useState(true);

  useEffect(() => {
    // بررسی اینکه آیا امروز قبلاً ثبت کرده
    if (participation?.dailyProgress) {
      const today = new Date().toISOString().split('T')[0];
      const hasSubmittedToday = participation.dailyProgress.some(p => {
        const progressDate = new Date(p.date).toISOString().split('T')[0];
        return progressDate === today;
      });
      setCanSubmitToday(!hasSubmittedToday);
      if (hasSubmittedToday) {
        setSubmitted(true);
      }
    }
  }, [participation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log('📤 [DailyProgressTracker] Submitting:', {
      challengeId,
      participationId: participation?.id,
      rating,
      notes: notes.trim() || null,
    });

    try {
      const response = await fetch("/api/challenges/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId,
          challengeParticipationId: participation?.id,
          satisfactionRating: rating,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      console.log('📥 [DailyProgressTracker] Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت پیشرفت");
      }

      setSubmitted(true);
      setCanSubmitToday(false);
      
      console.log('✅ [DailyProgressTracker] Success!');
      
      // ری‌لود صفحه بعد از 2 ثانیه
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("❌ [DailyProgressTracker] Submit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted || !canSubmitToday) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          عالی! پیشرفت امروز شما ثبت شد
        </h3>
        <p className="text-gray-600 text-sm">
          فردا دوباره بیایید و پیشرفت خود را ثبت کنید
        </p>
        {participation && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="font-semibold">{participation.progress}%</span>
              <span className="text-gray-600">پیشرفت</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="font-semibold">{participation.dailyProgress?.length || 0}</span>
              <span className="text-gray-600">روز فعال</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          گزارش پیشرفت امروز
        </h3>
        <p className="text-gray-600 text-sm">
          عملکرد امروز خود را ارزیابی کنید
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Input */}
        <div>
          <RatingInput 
            value={rating} 
            onChange={setRating} 
            disabled={loading}
          />
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            یادداشت (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="در این بخش می‌توانید یادداشت‌های خود را بنویسید..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1 text-left">
            {notes.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال ثبت...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              ثبت پیشرفت امروز
            </>
          )}
        </button>
      </form>

      {/* Progress Info */}
      {participation && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center flex-1">
              <div className="font-bold text-2xl text-teal-600">
                {participation.progress}%
              </div>
              <div className="text-gray-600 text-xs mt-1">پیشرفت کلی</div>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center flex-1">
              <div className="font-bold text-2xl text-cyan-600">
                {participation.dailyProgress?.length || 0}
              </div>
              <div className="text-gray-600 text-xs mt-1">روز فعال</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

