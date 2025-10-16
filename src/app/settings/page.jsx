"use client";

import { useState, useEffect } from "react";
import {
  Lock,
  Key,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Settings as SettingsIcon,
} from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";

export default function SettingsPage() {
  const { data: authUser, loading: authLoading } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  // Define breadcrumbs
  const breadcrumbs = [
    { name: "تنظیمات امنیتی", href: null }
  ];

  // Check if user is advisor
  const isAdvisor = authUser?.email === "melika.sangshakan@advisor.com";

  // Fetch user data
  useEffect(() => {
    if (authUser) {
      fetchUserData();
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: "error", text: "لطفاً همه فیلدها را پر کنید" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "رمز جدید و تایید آن مطابقت ندارند" });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: "error", text: "رمز عبور باید حداقل ۸ کاراکتر باشد" });
      return;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      setMessage({ type: "error", text: "رمز عبور باید شامل حروف و اعداد باشد" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ type: "error", text: "خطا در تغییر رمز عبور" });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: "رمز عبور وارد نشده", color: "gray" };
    
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password)) score += 12.5;
    if (/[A-Z]/.test(password)) score += 12.5;
    if (/[0-9]/.test(password)) score += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) score += 12.5;

    if (score < 30) return { score, text: "ضعیف", color: "red" };
    if (score < 60) return { score, text: "متوسط", color: "yellow" };
    if (score < 80) return { score, text: "قوی", color: "blue" };
    return { score, text: "بسیار قوی", color: "green" };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  if (authLoading) {
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
            برای دسترسی به تنظیمات، لطفاً وارد شوید
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
      <AdvancedNavigation 
        currentPage="/settings" 
        breadcrumbs={breadcrumbs}
      />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <SettingsIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            تنظیمات امنیتی
          </h1>
          <p className="text-gray-600">
            مدیریت رمز عبور و امنیت حساب کاربری
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {user?.name || authUser.name}
                </h3>
                <p className="text-gray-600">{authUser.email}</p>
                {isAdvisor && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 mt-1">
                    <Shield className="w-3 h-3 ml-1" />
                    مشاور سیستم
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">نقش در سیستم</p>
              <p className="font-semibold text-gray-800">
                {isAdvisor ? "مشاور تحصیلی" : "دانش‌آموز"}
              </p>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">تغییر رمز عبور</h2>
          </div>

          {isAdvisor && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">نکات امنیتی برای مشاور</h3>
              </div>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• رمز عبور خود را منظماً تغییر دهید</li>
                <li>• از رمزهای قوی و پیچیده استفاده کنید</li>
                <li>• رمز عبور را با هیچ کس به اشتراک نگذارید</li>
                <li>• در صورت مشکوک بودن فعالیت، فوراً رمز را تغییر دهید</li>
              </ul>
            </div>
          )}

          {/* Message */}
          {message.text && (
            <div className={`flex items-center gap-2 p-4 rounded-lg mb-6 ${
              message.type === "success" 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رمز عبور فعلی *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-12"
                  placeholder="رمز عبور فعلی خود را وارد کنید"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رمز عبور جدید *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-12"
                  placeholder="رمز عبور جدید (حداقل ۸ کاراکتر)"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">قدرت رمز عبور:</span>
                    <span className={`font-semibold text-${passwordStrength.color}-600`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                      style={{ width: `${passwordStrength.score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                تایید رمز عبور جدید *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-12"
                  placeholder="رمز عبور جدید را مجدداً وارد کنید"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2 text-sm">
                  {formData.newPassword === formData.confirmPassword ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      رمزها مطابقت دارند
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      رمزها مطابقت ندارند
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                الزامات رمز عبور:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  حداقل ۸ کاراکتر
                </li>
                <li className={`flex items-center gap-2 ${/[a-zA-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${/[a-zA-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  شامل حروف انگلیسی
                </li>
                <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  شامل اعداد
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  در حال تغییر رمز...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  تغییر رمز عبور
                </div>
              )}
            </button>
          </form>

          {/* Security Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              نکات امنیتی:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• رمز عبور خود را هرگز با دیگران به اشتراک نگذارید</li>
              <li>• از رمزهای مشابه برای سایت‌های مختلف استفاده نکنید</li>
              <li>• در صورت مشکوک بودن فعالیت، فوراً رمز عبور را تغییر دهید</li>
              <li>• همیشه از سیستم‌های مطمئن وارد حساب کاربری خود شوید</li>
            </ul>
          </div>
        </div>
      </div>

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