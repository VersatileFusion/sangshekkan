"use client";

import { useState, useEffect } from "react";
import { User, Lock, Eye, EyeOff, CheckCircle, Phone, Send, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@auth/create/react";
import useAuth from "@/utils/useAuth";

export default function SignInPage() {
  const navigate = useNavigate();
  const { update } = useSession();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  
  // OTP Login State
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [timer, setTimer] = useState(120);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const { signInWithCredentials } = useAuth();

  // OTP Timer Effect
  useEffect(() => {
    if (!isResendDisabled || !otpSent) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResendDisabled, otpSent]);

  // Format timer as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle URL parameters for special flows
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");
      const autoLogin = urlParams.get("autoLogin");
      const callbackUrl = urlParams.get("callbackUrl");

      if (message === "signup_success") {
        setSuccessMessage("🎉 ثبت‌نام با موفقیت انجام شد! اکنون وارد شوید.");
      }

      // Auto-populate email from localStorage if available (from recent signup)
      const recentSignupEmail = localStorage.getItem("recentSignupEmail");
      if (recentSignupEmail && autoLogin === "true" && !autoLoginAttempted) {
        setEmail(recentSignupEmail);
        setAutoLoginAttempted(true);

        // Show auto-login message
        setSuccessMessage(
          "🚀 در حال ورود خودکار... لطفاً رمز عبور خود را وارد کنید.",
        );

        // Focus password field
        setTimeout(() => {
          const passwordField = document.querySelector(
            'input[name="password"]',
          );
          if (passwordField) passwordField.focus();
        }, 500);
      }
    }
  }, [autoLoginAttempted]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!identifier || !password) {
      setError("لطفاً همه فیلدها را پر کنید");
      setLoading(false);
      return;
    }

    try {
      // Clear any stored signup email
      localStorage.removeItem("recentSignupEmail");

      const res = await fetch('/api/auth/credentials-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Field-specific error messages without refresh
        setError(data?.error || 'ورود ناموفق بود');
        setLoading(false);
        return;
      }
      // Success: redirect based on role
      console.log('[SignIn] Login successful, redirecting to:', data?.nextUrl || '/');
      
      // Force page reload to ensure session cookie is properly processed
      // The session provider needs a full page reload to detect the new cookie
      console.log('[SignIn] Using page reload to ensure session detection...');
      window.location.href = data?.nextUrl || '/';
    } catch (err) {
      setError('خطای شبکه/سرور. لطفاً دوباره تلاش کنید.');
      setLoading(false);
    }
  };

  // Send OTP for Login
  const handleSendOtpLogin = async () => {
    if (!phone || !/09\d{9}/.test(phone)) {
      setError('شماره موبایل وارد شده معتبر نیست.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setSendingOtp(true);

    try {
      const response = await fetch('/api/auth/otp/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ phone: phone })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'خطا در پردازش درخواست روی سرور.' }));
        setError(errorData.error || 'خطا در پردازش درخواست روی سرور.');
        setSendingOtp(false);
        return;
      }

      const data = await response.json();
      setSuccessMessage(data.message || 'کد تایید با موفقیت ارسال شد.');
      setOtpSent(true);
      setSendingOtp(false);
      
      // Start timer
      setTimer(120);
      setIsResendDisabled(true);

    } catch (error) {
      console.error('OTP Login Send error:', error);
      setError('خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.');
      setSendingOtp(false);
    }
  };

  // Verify OTP Login
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!phone || !otp) {
      setError("لطفاً شماره موبایل و کد تایید را وارد کنید");
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setError("لطفاً کد تایید ۶ رقمی را وارد کنید");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/otp/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });

      console.log('[SignIn] OTP Login response status:', response.status);
      
      let data = {};
      try {
        data = await response.json();
        console.log('[SignIn] OTP Login response data:', data);
      } catch (jsonError) {
        console.error('[SignIn] Failed to parse JSON response:', jsonError);
        setError("خطا در پردازش پاسخ سرور");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        console.log('[SignIn] OTP Login failed with error:', data.error);
        setError(data.error || "ورود ناموفق بود");
        setLoading(false);
        return;
      }

      // Success! Redirect based on role
      setSuccessMessage("ورود با موفقیت انجام شد!");
      console.log('[SignIn] OTP Login successful, redirecting to:', data?.nextUrl || '/');
      
      // Force page reload to ensure session cookie is properly processed
      // The session provider needs a full page reload to detect the new cookie
      console.log('[SignIn] Using page reload to ensure session detection...');
      console.log('[SignIn] Cookie should be set, waiting for session provider to process...');
      setTimeout(() => {
        console.log('[SignIn] Redirecting to:', data?.nextUrl || '/');
        window.location.href = data?.nextUrl || '/';
      }, 2000); // Increased delay to 2 seconds

    } catch (err) {
      console.error("OTP Login error:", err);
      setError("خطایی رخ داد. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <form
          noValidate
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">خوش آمدید</h1>
            <p className="text-gray-600">وارد سامانه گزارش‌گیری مطالعه شوید</p>
          </div>

          <div className="space-y-6">
            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setError(null);
                  setSuccessMessage(null);
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "password"
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                رمز عبور
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === "otp"
                    ? "bg-white text-teal-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                کد تایید
              </button>
            </div>

            {/* Password Login Fields */}
            {loginMethod === "password" && (
              <>
                {/* Phone or Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    شماره موبایل یا ایمیل
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="09xxxxxxxxx یا example@mail.com"
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
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
              </>
            )}

            {/* OTP Login Fields */}
            {loginMethod === "otp" && (
              <>
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
                      onClick={handleSendOtpLogin}
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
                          onClick={handleSendOtpLogin}
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
              </>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
                {successMessage}
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
              disabled={loading || (loginMethod === "otp" && !otpSent)}
              onClick={loginMethod === "otp" ? handleOtpLogin : onSubmit}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ورود...</span>
                </div>
              ) : loginMethod === "otp" && !otpSent ? (
                "ابتدا کد تایید ارسال کنید"
              ) : (
                "ورود"
              )}
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600">
              حساب کاربری ندارید؟{" "}
              <a
                href={`/account/signup${
                  typeof window !== "undefined" ? window.location.search : ""
                }`}
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                ثبت‌نام کنید
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
