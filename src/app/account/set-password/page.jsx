"use client";
import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SetPasswordPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const phone = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('phone') : '';
  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ذخیره رمز');
        setLoading(false);
        return;
      }
      // Sign-in using credentials (phone as identifier)
      await signInWithCredentials({ email: phone, password, callbackUrl: '/dashboard', redirect: true });
    } catch (err) {
      setError('خطای شبکه');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#E0F7FA 0%,#B2EBF2 100%)' }}>
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <h1 className="text-xl font-bold">تنظیم نام و رمز عبور</h1>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">نام و نام خانوادگی</label>
          <input className="w-full p-3 border rounded-lg" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">رمز عبور</label>
          <input type="password" className="w-full p-3 border rounded-lg" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg">{loading ? 'در حال ذخیره...' : 'ذخیره'}</button>
      </form>
    </div>
  );
}


