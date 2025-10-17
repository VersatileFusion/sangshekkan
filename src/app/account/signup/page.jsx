"use client";

import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, UserPlus, Mail, MapPin, Phone, Send, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [grade, setGrade] = useState("");
  const [major, setMajor] = useState("");
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  // OTP Timer state
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Countdown Timer Effect
  useEffect(() => {
    if (!isResendDisabled || !otpSent) return; // Don't run if already enabled or OTP not sent

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
  }, [isResendDisabled, otpSent]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP Code
  const handleSendOtp = async () => {
    console.log(`📤 [SignUp] Preparing to send OTP for: ${phone}`);

    if (!phone || !/09\d{9}/.test(phone)) {
      setError('شماره موبایل وارد شده معتبر نیست.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSendingOtp(true);

    try {
      // *** نکته کلیدی اینجاست: ارسال داده به صورت یک آبجکت JSON ***
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ phone: phone })
      });
      
      console.log(`📥 [SignUp] OTP response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'خطا در پردازش درخواست روی سرور.' }));
        console.error('❌ [SignUp] Error response data:', errorData);
        console.error('❌ [SignUp] Error response status:', response.status);
        const errorMessage = typeof errorData === 'string' ? errorData :
                           errorData?.message || 
                           errorData?.error || 
                           'خطا در پردازش درخواست روی سرور.';
        setError(errorMessage);
        setSendingOtp(false);
        return;
      }

      const data = await response.json();
      
      // بر اساس پاسخ موفق سرور، به کاربر پیام مناسب نمایش بده
      if (data?.message) {
        setSuccess(data.message);
      } else {
        setSuccess('کد تایید با موفقیت ارسال شد.');
      }
      
      // اینجا می‌توانید وضعیت UI را برای نمایش فیلد ورود کد تغییر دهید
      setOtpSent(true);
      setSendingOtp(false);
      
      // Start timer
      setTimer(120);
      setIsResendDisabled(true);

    } catch (error) {
      // سیستم پیشرفته مدیریت خطا
      if (error.response) {
        // سرور یک پاسخ خطا برگردانده (مثل 400, 409, 500)
        console.error('❌ [SignUp] Error response data:', error.response.data);
        console.error('❌ [SignUp] Error response status:', error.response.status);
        const errorMessage = typeof error.response.data === 'string' ? error.response.data :
                           error.response.data?.message || 
                           error.response.data?.error || 
                           'خطا در پردازش درخواست روی سرور.';
        setError(errorMessage);
      } else if (error.request) {
        // درخواست ارسال شده ولی پاسخی دریافت نشده
        console.error('❌ [SignUp] No response received:', error.request);
        setError('پاسخی از سرور دریافت نشد. اتصال اینترنت خود را بررسی کنید.');
      } else {
        // خطایی در تنظیم خود درخواست رخ داده
        console.error('❌ [SignUp] Error setting up request:', error.message);
        setError('خطا در ساخت درخواست برای ارسال به سرور.');
      }
      setSendingOtp(false);
    }
  };

  // Complete Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validation
    if (!phone || !name || !password) {
      setError("لطفاً همه فیلدهای الزامی را پر کنید");
      setLoading(false);
      return;
    }

    if (!otpSent) {
      setError("ابتدا باید کد تایید را درخواست کنید");
      setLoading(false);
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("لطفاً کد تایید ۶ رقمی را وارد کنید");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: otp,
          name,
          password,
          grade: grade || null,
          field: major || null,
          city: city || null,
          province: province || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = typeof data.error === 'string' ? data.error : 
                           data.error?.message || 
                           data.error?.error || 
                           "خطا در ثبت‌نام";
        setError(errorMessage);
        setLoading(false);
        return;
      }

      console.log('[Registration] Success response:', data);

      // Success! Check if auto-login was successful
      setSuccess("ثبت‌نام با موفقیت انجام شد!");
      setOtpVerified(true);

      if (data?.requireLogin) {
        // Auto-login failed, redirect to signin
        console.log('[Registration] Auto-login failed, redirecting to signin');
        setTimeout(() => {
          window.location.href = `/account/signin?phone=${encodeURIComponent(phone)}`;
        }, 1500);
        return;
      }

      // Auto-login successful, redirect to dashboard
      console.log('[Registration] Auto-login successful, redirecting to:', data?.nextUrl || '/student-dashboard');
      
      // Force session refresh by reloading the page
      // This ensures the session provider picks up the new cookie
      setTimeout(() => {
        window.location.href = data?.nextUrl || '/student-dashboard';
      }, 1000);

    } catch (err) {
      console.error("Registration error:", err);
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8"
      style={{
        background: "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <form
          noValidate
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              ایجاد حساب کاربری
            </h1>
            <p className="text-gray-600">
              در سامانه گزارش‌گیری مطالعه ثبت‌نام کنید
            </p>
          </div>

          <div className="space-y-6">
            {/* Phone Field with Send OTP Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                شماره موبایل <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    required
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                    disabled={otpSent}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || otpSent || !phone}
                  className="px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {sendingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال ارسال...</span>
                    </>
                  ) : otpSent ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>ارسال شد</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال کد</span>
                    </>
                  )}
                </button>
              </div>
              {otpSent && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-teal-600">
                    کد تایید به شماره شما ارسال شد
                  </p>
                  {isResendDisabled ? (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(timer)}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold disabled:opacity-50"
                    >
                      {sendingOtp ? 'در حال ارسال...' : 'ارسال مجدد کد'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* OTP Field (shown after OTP is sent) */}
            {otpSent && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  کد تایید (۶ رقمی) <span className="text-red-500">*</span>
                </label>
                <input
                  name="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="کد ۶ رقمی را وارد کنید"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center text-lg tracking-widest"
                />
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                نام و نام خانوادگی <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                رمز عبور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۸ کاراکتر"
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

            {/* Province/City Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">استان و شهر (اختیاری)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    name="province"
                    value={province}
                    onChange={(e) => { setProvince(e.target.value); setCity(""); }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">انتخاب استان</option>
                    {[
                      "تهران","البرز","اصفهان","فارس","خراسان رضوی","آذربایجان شرقی","آذربایجان غربی","گیلان","مازندران","یزد","کرمان","سیستان و بلوچستان","همدان","کردستان","خوزستان","زنجان","قزوین","گلستان","اردبیل","کرمانشاه","بوشهر","هرمزگان","چهارمحال و بختیاری","لرستان","کهگیلویه و بویراحمد","ایلام","خراسان شمالی","خراسان جنوبی","سمنان","قم","مرکزی"
                    ].map((p, idx) => (
                      <option key={`${p}-${idx}`} value={p}>{p}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <div>
                  <input
                    type="text"
                    name="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!province}
                    placeholder="نام شهر"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Grade Field (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">پایه تحصیلی (اختیاری)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "ششم",
                  "هفتم",
                  "هشتم",
                  "نهم",
                  "دهم",
                  "یازدهم",
                  "دوازدهم",
                ].map((g) => (
                  <label key={g} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="grade"
                      value={g}
                      checked={grade === g}
                      onChange={(e) => {
                        setGrade(e.target.value);
                        setMajor("");
                      }}
                      className="text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-sm">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditional Major Field (optional) */}
            {["دهم", "یازدهم", "دوازدهم"].includes(grade) && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-semibold text-gray-700 mb-2">رشته تحصیلی</label>
                <div className="grid grid-cols-3 gap-2">
                  {["ریاضی", "تجربی", "انسانی"].map((m) => (
                    <label key={m} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="major"
                        value={m}
                        checked={major === m}
                        onChange={(e) => setMajor(e.target.value)}
                        className="text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !otpSent || otpVerified}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ثبت‌نام...</span>
                </div>
              ) : otpVerified ? (
                "ثبت‌نام موفق"
              ) : (
                "تکمیل ثبت‌نام"
              )}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <a
                href="/account/signin"
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                وارد شوید
              </a>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            سامانه گزارش‌گیری مطالعه - خانم ملیکا سنگ‌شکن
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Vazirmatn', sans-serif;
          direction: rtl;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
