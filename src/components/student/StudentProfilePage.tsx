'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, GraduationCap, MapPin, Calendar, Upload, X, Camera } from 'lucide-react';
// @ts-ignore
import { useSession } from '@auth/create/react';
import { useNavigate } from 'react-router-dom';
import StudentDashboardLayout from './StudentDashboardLayout';

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          if (data.user?.profileImageUrl) {
            setAvatarPreview(data.user.profileImageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user) {
      fetchUserData();
    }
  }, [session, status]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (200MB max)
    if (file.size > 200 * 1024 * 1024) {
      alert('حجم فایل نباید بیشتر از ۲۰۰ مگابایت باشد');
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('فقط فایل‌های JPG و PNG مجاز هستند');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/student/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarPreview(data.profileImageUrl);
        setUserData({ ...userData, profileImageUrl: data.profileImageUrl });
        alert('عکس پروفایل با موفقیت آپلود شد');
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در آپلود عکس');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('خطا در آپلود عکس. لطفاً دوباره تلاش کنید.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید عکس پروفایل را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch('/api/profile/student/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setAvatarPreview(null);
        setUserData({ ...userData, profileImageUrl: null });
        alert('عکس پروفایل با موفقیت حذف شد');
      } else {
        alert('خطا در حذف عکس');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('خطا در حذف عکس. لطفاً دوباره تلاش کنید.');
    }
  };

  if (loading) {
    return (
      <StudentDashboardLayout current="profile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </StudentDashboardLayout>
    );
  }

  return (
    <StudentDashboardLayout current="profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">پروفایل شخصی</h1>
            <p className="text-teal-50 mt-1">مشاهده و مدیریت اطلاعات حساب کاربری</p>
          </div>

          {/* Avatar Section */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">عکس پروفایل</h2>
            <div className="flex items-center gap-6">
              {/* Avatar Display */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="پروفایل"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    title="حذف عکس"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label
                  htmlFor="avatar-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    uploadingAvatar
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  {uploadingAvatar ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال آپلود...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>آپلود عکس جدید</span>
                    </>
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">
                  فرمت‌های مجاز: JPG, PNG • حداکثر حجم: ۲۰۰ مگابایت
                </p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="px-8 py-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">اطلاعات شخصی</h2>

            {/* Name */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">نام و نام خانوادگی</p>
                <p className="text-base font-medium text-gray-800">{userData?.name || 'تعیین نشده'}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">شماره تماس</p>
                <p className="text-base font-medium text-gray-800 dir-ltr text-right">{userData?.phone || 'تعیین نشده'}</p>
              </div>
            </div>

            {/* Grade */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">پایه تحصیلی</p>
                <p className="text-base font-medium text-gray-800">{userData?.grade || 'تعیین نشده'}</p>
              </div>
            </div>

            {/* Field */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">رشته تحصیلی</p>
                <p className="text-base font-medium text-gray-800">{userData?.field || 'تعیین نشده'}</p>
              </div>
            </div>

            {/* City */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">محل زندگی</p>
                <p className="text-base font-medium text-gray-800">{userData?.city || 'تعیین نشده'}</p>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">تاریخ ثبت‌نام</p>
                <p className="text-base font-medium text-gray-800">
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString('fa-IR')
                    : 'تعیین نشده'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentDashboardLayout>
  );
}

