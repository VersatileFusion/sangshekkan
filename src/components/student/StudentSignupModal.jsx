"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Lock,
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function StudentSignupModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Form, 2: OTP, 3: Success
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    studentGrade: "",
    studentField: "",
    email: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const grades = [
    { value: "7", label: "هفتم" },
    { value: "8", label: "هشتم" },
    { value: "9", label: "نهم" },
    { value: "10", label: "دهم" },
    { value: "11", label: "یازدهم" },
    { value: "12", label: "دوازدهم" },
  ];

  const fields = [
    { value: "math", label: "ریاضی" },
    { value: "experimental", label: "تجربی" },
    { value: "humanities", label: "انسانی" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (!isResendDisabled || step !== 2) return; // Only run in step 2 when timer is active

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResendDisabled(false); // Enable the resend button
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [isResendDisabled, step]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("نام و نام خانوادگی الزامی است");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("شماره موبایل الزامی است");
      return false;
    }

    const phoneRegex = /^(\+98|0)?9\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("فرمت شماره موبایل معتبر نیست");
      return false;
    }

    if (formData.password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      return false;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("رمز عبور باید شامل حروف و اعداد باشد");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("رمز عبور و تایید آن مطابقت ندارند");
      return false;
    }

    if (!formData.studentGrade) {
      setError("انتخاب پایه تحصیلی الزامی است");
      return false;
    }

    if (!formData.studentField) {
      setError("انتخاب رشته الزامی است");
      return false;
    }

    return true;
  };

  const sendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          purpose: "signup",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "خطا در ارسال کد");
      }

      setStep(2);
      // Start timer
      setTimer(120);
      setIsResendDisabled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError("کد تایید باید ۶ رقم باشد");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await registerUser();
    } catch (err) {
      setError(err.message || "خطا در تایید کد");
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    try {
      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          code: otpCode,
          name: formData.name,
          password: formData.password,
          grade: formData.studentGrade || null,
          field: formData.studentField || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در ثبت‌نام");
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  };

  const resendOTP = async () => {
    if (isResendDisabled) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          purpose: "signup",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "خطا در ارسال کد");
      }

      // Restart timer
      setTimer(120);
      setIsResendDisabled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      studentGrade: "",
      studentField: "",
      email: "",
    });
    setOtpCode("");
    setError("");
    setOtpTimer(0);
    onClose();
  };

  const handleSuccess = () => {
    handleClose();

    // Enhanced success flow - redirect to home with auto-login
    setTimeout(() => {
      // Auto-login and redirect to home
      window.location.href =
        "/account/signin?callbackUrl=/&autoLogin=true&message=signup_success";
    }, 1500); // Small delay for better UX
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="mr-3">
              <h2 className="text-xl font-bold text-gray-800">
                {step === 1 && "ثبت‌نام دانش‌آموز"}
                {step === 2 && "تایید شماره موبایل"}
                {step === 3 && "ثبت‌نام موفق"}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 1 && "مرحله ۱ از ۳: اطلاعات شخصی"}
                {step === 2 && "مرحله ۲ از ۳: کد تایید"}
                {step === 3 && "مرحله ۳ از ۳: تکمیل"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Registration Form */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  نام و نام خانوادگی *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="نام کامل خود را وارد کنید"
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                  <span className="text-amber-500 font-bold">⚠</span>
                  <span>توجه: اطلاعات پروفایل (مانند نام و نام خانوادگی) پس از ثبت‌نام قابل تغییر نیست. لطفاً اطلاعات خود را با دقت وارد کنید.</span>
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  شماره موبایل *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="۰۹xxxxxxxxx"
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ایمیل (اختیاری)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@gmail.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Grade & Field */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    پایه تحصیلی *
                  </label>
                  <select
                    name="studentGrade"
                    value={formData.studentGrade}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">انتخاب پایه</option>
                    {grades.map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رشته *
                  </label>
                  <select
                    name="studentField"
                    value={formData.studentField}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">انتخاب رشته</option>
                    {fields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  رمز عبور *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="حداقل ۸ کاراکتر (شامل حرف و عدد)"
                    className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  تایید رمز عبور *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "در حال ارسال کد..." : "ارسال کد تایید"}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-lg font-bold text-gray-800">
                کد تایید ارسال شد
              </h3>
              <p className="text-gray-600">
                کد ۶ رقمی به شماره {formData.phone} ارسال شد
              </p>

              <div>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(value);
                    setError("");
                  }}
                  placeholder="۱۲۳۴۵۶"
                  className="w-full p-4 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                onClick={verifyOTP}
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "در حال بررسی..." : "تایید کد"}
              </button>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">کد دریافت نکردید؟</span>
                {isResendDisabled ? (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timer)}</span>
                  </div>
                ) : (
                  <button
                    onClick={resendOTP}
                    disabled={loading}
                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50"
                  >
                    {loading ? "در حال ارسال..." : "ارسال مجدد"}
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                بازگشت به اطلاعات شخصی
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-lg font-bold text-gray-800">
                ثبت‌نام موفقیت‌آمیز!
              </h3>
              <p className="text-gray-600">
                حساب کاربری شما با موفقیت ایجاد شد.
                <br />
                اطلاعات شما به خانم سنگ‌شکن ارسال شده است.
              </p>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-700">
                  اکنون می‌توانید وارد سیستم شده و گزارش‌های روزانه خود را ثبت
                  کنید.
                </p>
              </div>

              <button
                onClick={handleSuccess}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105"
              >
                ورود به سیستم
              </button>
            </div>
          )}
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
