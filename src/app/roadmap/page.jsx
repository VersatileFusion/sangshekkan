"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Target,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Save,
  X,
  User,
} from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";

export default function RoadmapPage() {
  const { data: authUser, loading: authLoading } = useUser();
  const [user, setUser] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_date: "",
    target_tests: "",
    target_hours: "",
    subjects: "",
    priority: "medium",
    status: "pending",
    notes: "",
  });

  // Define breadcrumbs for navigation
  const breadcrumbs = [{ name: "نقشه‌ی راه", href: null }];

  // Fetch user profile and milestones
  useEffect(() => {
    if (authUser) {
      fetchUserData();
      fetchMilestones();
    } else if (!authLoading) {
      // User is not authenticated and auth is ready
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/milestones");
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      } else {
        console.error("Failed to fetch milestones");
      }
    } catch (error) {
      console.error("Error fetching milestones:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort milestones by date
  const sortedMilestones = useMemo(() => {
    return [...milestones].sort(
      (a, b) => new Date(a.target_date) - new Date(b.target_date),
    );
  }, [milestones]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.target_date || !formData.target_tests) {
      alert("لطفاً فیلدهای ضروری را پر کنید");
      return;
    }

    try {
      const url = isEditMode
        ? `/api/milestones/${selectedMilestone.id}`
        : "/api/milestones";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          target_date: formData.target_date,
          target_tests: parseInt(formData.target_tests),
          target_hours: formData.target_hours
            ? parseInt(formData.target_hours)
            : null,
          subjects: formData.subjects || null,
          priority: formData.priority,
          status: formData.status,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          target_date: "",
          target_tests: "",
          target_hours: "",
          subjects: "",
          priority: "medium",
          status: "pending",
          notes: "",
        });
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedMilestone(null);

        // Refresh milestones
        fetchMilestones();
        alert(
          isEditMode
            ? "هدف با موفقیت به‌روزرسانی شد"
            : "هدف جدید با موفقیت اضافه شد",
        );
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت هدف");
      }
    } catch (error) {
      console.error("Error submitting milestone:", error);
      alert("خطا در ثبت هدف");
    }
  };

  // Open modal for adding new milestone
  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedMilestone(null);
    setFormData({
      title: "",
      description: "",
      target_date: "",
      target_tests: "",
      target_hours: "",
      subjects: "",
      priority: "medium",
      status: "pending",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing milestone
  const openEditModal = (milestone) => {
    setIsEditMode(true);
    setSelectedMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      target_date: milestone.target_date,
      target_tests: milestone.target_tests.toString(),
      target_hours: milestone.target_hours?.toString() || "",
      subjects: milestone.subjects || "",
      priority: milestone.priority,
      status: milestone.status,
      notes: milestone.notes || "",
    });
    setIsModalOpen(true);
  };

  // Delete milestone
  const deleteMilestone = async (id) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این هدف را حذف کنید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/milestones/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMilestones();
        alert("هدف با موفقیت حذف شد");
      } else {
        alert("خطا در حذف هدف");
      }
    } catch (error) {
      console.error("Error deleting milestone:", error);
      alert("خطا در حذف هدف");
    }
  };

  // Toggle milestone status
  const toggleStatus = async (milestone) => {
    const newStatus =
      milestone.status === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(`/api/milestones/${milestone.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchMilestones();
      } else {
        alert("خطا در به‌روزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating milestone status:", error);
      alert("خطا در به‌روزرسانی وضعیت");
    }
  };

  // Calculate progress statistics
  const progressStats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === "completed").length;
    const pending = milestones.filter((m) => m.status === "pending").length;
    const overdue = milestones.filter(
      (m) => m.status === "pending" && new Date(m.target_date) < new Date(),
    ).length;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
    };
  }, [milestones]);

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
            برای دسترسی به نقشه‌ی راه، لطفاً وارد شوید
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
      <AdvancedNavigation currentPage="/roadmap" breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">کل اهداف</h3>
            <p className="text-2xl font-bold text-blue-600">
              {progressStats.total}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">تکمیل شده</h3>
            <p className="text-2xl font-bold text-green-600">
              {progressStats.completed}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">در انتظار</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {progressStats.pending}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">عقب‌افتاده</h3>
            <p className="text-2xl font-bold text-red-600">
              {progressStats.overdue}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">پیشرفت کلی</h2>
            <span className="text-lg font-semibold text-teal-600">
              {progressStats.completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressStats.completionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>شروع</span>
            <span>هدف نهایی</span>
          </div>
        </div>

        {/* Add Milestone Button */}
        <div className="text-center mb-8">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center mx-auto shadow-lg"
          >
            <Plus className="w-5 h-5 ml-2" />
            افزودن هدف جدید
          </button>
        </div>

        {/* Milestones Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <MapPin className="w-6 h-6 ml-2 text-teal-600" />
            نقاط عطف مسیر شما
          </h2>

          {milestones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">هنوز هدفی تعریف نکرده‌اید</p>
              <p className="text-sm mt-2">
                برای شروع، اولین هدف خود را اضافه کنید
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMilestones.map((milestone, index) => {
                const isOverdue =
                  milestone.status === "pending" &&
                  new Date(milestone.target_date) < new Date();
                const isCompleted = milestone.status === "completed";

                return (
                  <div key={milestone.id} className="relative">
                    {/* Timeline Line */}
                    {index < milestones.length - 1 && (
                      <div className="absolute right-6 top-12 w-0.5 h-16 bg-gray-300"></div>
                    )}

                    <div
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
                        isCompleted
                          ? "bg-green-50 border-green-200"
                          : isOverdue
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      {/* Status Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500"
                            : isOverdue
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : isOverdue ? (
                          <AlertCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {milestone.title}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(milestone)}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMilestone(milestone.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {milestone.description && (
                          <p className="text-gray-600 mb-3">
                            {milestone.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 ml-1" />
                            {new Date(milestone.target_date).toLocaleDateString(
                              "fa-IR",
                            )}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Target className="w-4 h-4 ml-1" />
                            {milestone.target_tests} تست
                          </div>
                          {milestone.target_hours && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 ml-1" />
                              {milestone.target_hours} ساعت
                            </div>
                          )}
                          <div
                            className={`text-sm font-semibold ${
                              milestone.priority === "high"
                                ? "text-red-600"
                                : milestone.priority === "medium"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            اولویت:{" "}
                            {milestone.priority === "high"
                              ? "بالا"
                              : milestone.priority === "medium"
                                ? "متوسط"
                                : "پایین"}
                          </div>
                        </div>

                        {milestone.subjects && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500">
                              دروس:{" "}
                            </span>
                            <span className="text-sm text-gray-700">
                              {milestone.subjects}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => toggleStatus(milestone)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                              isCompleted
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {isCompleted
                              ? "بازگردانی به انتظار"
                              : "علامت‌گذاری تکمیل"}
                          </button>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isCompleted
                                ? "bg-green-100 text-green-800"
                                : isOverdue
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isCompleted
                              ? "تکمیل شده"
                              : isOverdue
                                ? "عقب‌افتاده"
                                : "در انتظار"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? "ویرایش هدف" : "افزودن هدف جدید"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    عنوان هدف *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="مثال: حل 1000 تست ریاضی"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows="3"
                    placeholder="توضیحات تکمیلی در مورد این هدف..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تاریخ هدف *
                    </label>
                    <input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_date: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اولویت
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="low">پایین</option>
                      <option value="medium">متوسط</option>
                      <option value="high">بالا</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تعداد تست هدف *
                    </label>
                    <input
                      type="number"
                      value={formData.target_tests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_tests: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="1000"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ساعت مطالعه هدف
                    </label>
                    <input
                      type="number"
                      value={formData.target_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_hours: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="100"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    دروس مرتبط
                  </label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) =>
                      setFormData({ ...formData, subjects: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="ریاضی، فیزیک، شیمی"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center"
                  >
                    <Save className="w-5 h-5 ml-2" />
                    {isEditMode ? "به‌روزرسانی" : "ثبت هدف"}
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
