"use client";

import { useState } from "react";

export default function TestAdvisorPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testCredentials = async () => {
    setLoading(true);
    try {
      // Test the credentials by attempting signin
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "advisor@study.com",
          password: "advisor123",
          callbackUrl: "/",
        }),
      });

      const data = await response.json();
      setResult(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🔐 تست حساب مشاور
          </h1>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white mb-8">
            <h2 className="text-xl font-bold mb-4">اطلاعات ورود مشاور:</h2>
            <div className="space-y-2">
              <p>
                <strong>ایمیل:</strong> advisor@study.com
              </p>
              <p>
                <strong>رمز عبور:</strong> advisor123
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={testCredentials}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "در حال تست..." : "تست اطلاعات ورود"}
            </button>
          </div>

          {result && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-bold mb-2">نتیجه:</h3>
              <pre className="text-sm overflow-auto">{result}</pre>
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href="/account/signin"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              رفتن به صفحه ورود ←
            </a>
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
