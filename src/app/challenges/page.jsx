"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Target,
  Calendar,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Award,
  Zap,
  User,
} from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";
import DailyProgressTracker from "@/components/challenges/DailyProgressTracker";

export default function ChallengesPage() {
  const { data: authUser, loading: authLoading } = useUser();
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isAdvisor, setIsAdvisor] = useState(false);

  // Form data for creating/editing challenges
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  // Define breadcrumbs
  const breadcrumbs = [{ name: "چالش‌های مطالعاتی", href: null }];

  // Fetch user and check if advisor
  useEffect(() => {
    if (authUser) {
      fetchUserData();
      setIsAdvisor(authUser.email === "melika.sangshakan@advisor.com");
    }
  }, [authUser]);

  // Fetch data
  useEffect(() => {
    if (authUser) {
      fetchChallenges();
      fetchParticipations();
    }
  }, [authUser]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched Challenges for Student Dashboard:', data.challenges);
        setChallenges(data.challenges || []);
      } else {
        console.error("Failed to fetch challenges:", response.status);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipations = async () => {
    try {
      const response = await fetch("/api/challenges/participate");
      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
      } else {
        console.error("Failed to fetch participations");
      }
    } catch (error) {
      console.error("Error fetching participations:", error);
    }
  };

  // Participate in challenge
  const participateInChallenge = async (challengeId) => {
    try {
      const response = await fetch("/api/challenges/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeId,
          participation_date: new Date().toISOString().split("T")[0],
          completed: true,
        }),
      });

      if (response.ok) {
        fetchParticipations();
        alert("مشارکت شما با موفقیت ثبت شد! 🎉");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت مشارکت");
      }
    } catch (error) {
      console.error("Error participating in challenge:", error);
      alert("خطا در ثبت مشارکت");
    }
  };

  // Create/Update challenge (Advisor only)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdvisor) {
      alert("فقط مشاور می‌تواند چالش ایجاد کند");
      return;
    }

    if (!formData.title || !formData.start_date || !formData.end_date) {
      alert("لطفاً فیلدهای ضروری را پر کنید");
      return;
    }

    try {
      const url = isEditMode
        ? `/api/challenges/${selectedChallenge.id}`
        : "/api/challenges";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          title: "",
          description: "",
          start_date: "",
          end_date: "",
          is_active: true,
        });
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedChallenge(null);
        fetchChallenges();
        alert(
          isEditMode
            ? "چالش با موفقیت به‌روزرسانی شد"
            : "چالش جدید با موفقیت ایجاد شد",
        );
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت چالش");
      }
    } catch (error) {
      console.error("Error submitting challenge:", error);
      alert("خطا در ثبت چالش");
    }
  };

  // Delete challenge (Advisor only)
  const deleteChallenge = async (id) => {
    if (!isAdvisor) {
      alert("فقط مشاور می‌تواند چالش حذف کند");
      return;
    }

    if (!confirm("آیا مطمئن هستید که می‌خواهید این چالش را حذف کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/challenges/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchChallenges();
        alert("چالش با موفقیت حذف شد");
      } else {
        alert("خطا در حذف چالش");
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert("خطا در حذف چالش");
    }
  };

  // Open modal for adding new challenge
  const openAddModal = () => {
    if (!isAdvisor) {
      alert("فقط مشاور می‌تواند چالش ایجاد کند");
      return;
    }

    setIsEditMode(false);
    setSelectedChallenge(null);
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing challenge
  const openEditModal = (challenge) => {
    if (!isAdvisor) {
      alert("فقط مشاور می‌تواند چالش ویرایش کند");
      return;
    }

    setIsEditMode(true);
    setSelectedChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      is_active: challenge.is_active,
    });
    setIsModalOpen(true);
  };

  // Calculate statistics
  const challengeStats = useMemo(() => {
    const total = challenges.length;
    const active = challenges.filter((c) => c.is_active).length;
    const myParticipations = participations.length;
    const uniqueChallenges = new Set(participations.map((p) => p.challenge_id))
      .size;

    return {
      total,
      active,
      myParticipations,
      uniqueChallenges,
    };
  }, [challenges, participations]);

  // Get user's participation for each challenge
  const getUserParticipation = (challengeId) => {
    const today = new Date().toISOString().split("T")[0];
    return participations.some(
      (p) =>
        p.challenge_id === challengeId &&
        p.participation_date === today &&
        p.completed,
    );
  };

  // Calculate challenge completion percentage
  const getChallengeProgress = (challenge) => {
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const userParticipations = participations.filter(
      (p) => p.challenge_id === challenge.id && p.completed,
    ).length;

    return totalDays > 0
      ? Math.min((userParticipations / totalDays) * 100, 100)
      : 0;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ورود به سیستم لازم است
          </h2>
          <p className="text-gray-600 mb-4">
            برای دسترسی به چالش‌ها، لطفاً وارد شوید
          </p>
          <a
            href="/account/signin"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            ورود به سیستم
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Advanced Navigation */}
      <AdvancedNavigation currentPage="/challenges" breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            چالش‌های مطالعاتی
          </h1>
          <p className="text-gray-600">
            در چالش‌های گروهی شرکت کنید و عادت‌های مثبت بسازید!
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">کل چالش‌ها</h3>
            <p className="text-2xl font-bold text-blue-600">
              {challengeStats.total}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Zap className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">چالش‌های فعال</h3>
            <p className="text-2xl font-bold text-green-600">
              {challengeStats.active}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">مشارکت‌های من</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {challengeStats.myParticipations}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">
              چالش‌های شرکت کرده
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {challengeStats.uniqueChallenges}
            </p>
          </div>
        </div>

        {/* Add Challenge Button (Advisor Only) */}
        {isAdvisor && (
          <div className="text-center mb-8">
            <button
              onClick={openAddModal}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center mx-auto shadow-lg"
            >
              <Plus className="w-5 h-5 ml-2" />
              ایجاد چالش جدید
            </button>
          </div>
        )}

        {/* Challenges List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Trophy className="w-6 h-6 ml-2 text-yellow-600" />
            چالش‌های موجود
          </h2>

          {challenges.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">هنوز چالشی ایجاد نشده است</p>
              {isAdvisor && (
                <p className="text-sm mt-2">اولین چالش را ایجاد کنید</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => {
                const isActive = challenge.is_active;
                const progress = getChallengeProgress(challenge);
                const hasParticipatedToday = getUserParticipation(challenge.id);
                const startDate = new Date(challenge.start_date);
                const endDate = new Date(challenge.end_date);
                const now = new Date();
                const isInProgress = now >= startDate && now <= endDate;

                return (
                  <div
                    key={challenge.id}
                    className={`rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl ${
                      isActive && isInProgress
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200"
                        : "bg-gray-50 border-2 border-gray-200"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          {challenge.title}
                        </h3>
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            isActive && isInProgress
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Clock className="w-3 h-3 ml-1" />
                          {isActive && isInProgress ? "در حال اجرا" : "غیرفعال"}
                        </div>
                      </div>

                      {isAdvisor && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(challenge)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteChallenge(challenge.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {challenge.description && (
                      <p className="text-gray-600 mb-4 text-sm">
                        {challenge.description}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 ml-1" />
                        شروع:{" "}
                        {new Date(challenge.start_date).toLocaleDateString(
                          "fa-IR",
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 ml-1" />
                        پایان:{" "}
                        {new Date(challenge.end_date).toLocaleDateString(
                          "fa-IR",
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          پیشرفت
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button or Progress Tracker */}
                    {isActive && isInProgress && (
                      <>
                        {/* بررسی اینکه آیا کاربر در چالش شرکت کرده */}
                        {participations.some(p => p.challenge_id === challenge.id) ? (
                          // نمایش Progress Tracker
                          <div className="mt-4">
                            <DailyProgressTracker 
                              challengeId={challenge.id}
                              participation={participations.find(p => p.challenge_id === challenge.id)}
                            />
                          </div>
                        ) : (
                          // دکمه شرکت در چالش
                          <button
                            onClick={() => participateInChallenge(challenge.id)}
                            className="w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105"
                          >
                            <div className="flex items-center justify-center">
                              <Target className="w-4 h-4 ml-2" />
                              شرکت در چالش
                            </div>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Challenge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? "ویرایش چالش" : "ایجاد چالش جدید"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    عنوان چالش *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="مثال: ۵ صبح بیدار شدن"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows="3"
                    placeholder="توضیحات چالش و قوانین آن..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تاریخ شروع *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تاریخ پایان *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="mr-2 text-sm text-gray-700"
                  >
                    چالش فعال باشد
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
                  >
                    {isEditMode ? "به‌روزرسانی" : "ایجاد چالش"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
      `}</style>
    </div>
  );
}
