'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Camera, X, Briefcase, MessageSquare, Save } from 'lucide-react';
// @ts-ignore
import { useSession } from '@auth/create/react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

export default function AdminProfilePage() {
  const { data: session, status } = useSession();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    landlinePhone: '',
    officeAddress: '',
    bio: '',
  });

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
          setFormData({
            name: data.user?.name || '',
            phone: data.user?.phone || '',
            landlinePhone: data.user?.landlinePhone || '',
            officeAddress: data.user?.officeAddress || '',
            bio: data.user?.bio || '',
          });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
      const formDataToSend = new FormData();
      formDataToSend.append('avatar', file);

      const response = await fetch('/api/profile/admin/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarPreview(data.profileImageUrl);
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
      const response = await fetch('/api/profile/admin/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setAvatarPreview(null);
        alert('عکس پروفایل با موفقیت حذف شد');
      } else {
        alert('خطا در حذف عکس');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('خطا در حذف عکس. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/profile/admin', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('تغییرات با موفقیت ذخیره شد');
        // Refresh data
        const updatedResponse = await fetch('/api/users', {
          method: 'GET',
          credentials: 'include',
        });
        if (updatedResponse.ok) {
          const data = await updatedResponse.json();
          setUserData(data.user);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('خطا در ذخیره تغییرات. لطفاً دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout current="profile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout current="profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">ویرایش پروفایل</h1>
            <p className="text-purple-50 mt-1">مدیریت اطلاعات حساب کاربری</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">عکس پروفایل</h2>
              <div className="flex items-center gap-6">
                {/* Avatar Display */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
                      type="button"
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
                        : 'bg-purple-500 text-white hover:bg-purple-600'
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

            {/* Form Fields */}
            <div className="px-8 py-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">اطلاعات شخصی</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline ml-2" />
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="نام کامل خود را وارد کنید"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-2" />
                  شماره موبایل
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dir-ltr text-right"
                  placeholder="09123456789"
                />
              </div>

              {/* Landline Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-2" />
                  شماره تماس ثابت (اختیاری)
                </label>
                <input
                  type="text"
                  name="landlinePhone"
                  value={formData.landlinePhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dir-ltr text-right"
                  placeholder="02112345678"
                />
              </div>

              {/* Office Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline ml-2" />
                  آدرس دفتر مشاور (اختیاری)
                </label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  placeholder="آدرس کامل دفتر را وارد کنید"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline ml-2" />
                  بیوگرافی / توضیحات (اختیاری)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="توضیحات کوتاهی در مورد خود بنویسید..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>ذخیره تغییرات</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

