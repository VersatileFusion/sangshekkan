'use client';

import React, { useState, useEffect } from 'react';
import { User, Phone, GraduationCap, MapPin, Briefcase, Star, ChevronLeft, ChevronRight } from 'lucide-react';
// @ts-ignore
import { useSession } from '@auth/create/react';

interface UserData {
  id: string;
  name: string | null;
  phone?: string;
  role: string;
  grade?: string | null;
  field?: string | null;
  city?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  officeAddress?: string | null;
  landlinePhone?: string | null;
  pinned: boolean;
}

export default function MembersList() {
  const { data: session } = useSession();
  const [pinnedUsers, setPinnedUsers] = useState<UserData[]>([]);
  const [otherUsers, setOtherUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);

  const isAdmin = (session as any)?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users/list?page=${page}&pageSize=20`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPinnedUsers(data.pinnedUsers || []);
        setOtherUsers(data.otherUsers || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (userId: string, currentPinned: boolean) => {
    if (!isAdmin) return;
    
    setTogglingPin(userId);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-pin`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh the list
        await fetchUsers();
      } else {
        alert('خطا در تغییر وضعیت پین');
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('خطا در تغییر وضعیت پین');
    } finally {
      setTogglingPin(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Pinned Users Section */}
      {pinnedUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">اعضای ویژه</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg border-2 border-yellow-200 p-6 hover:shadow-xl transition-all"
              >
                {/* Header with Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{user.name || 'بدون نام'}</h3>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-500 text-white rounded-full mt-1">
                      {user.role === 'ADMIN' ? 'مدیر' : 'دانش‌آموز'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="dir-ltr text-right">{user.phone}</span>
                    </div>
                  )}

                  {user.landlinePhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="dir-ltr text-right">{user.landlinePhone}</span>
                    </div>
                  )}

                  {user.grade && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>{user.grade}</span>
                      {user.field && <span> - {user.field}</span>}
                    </div>
                  )}

                  {user.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{user.city}</span>
                    </div>
                  )}

                  {user.officeAddress && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{user.officeAddress}</span>
                    </div>
                  )}

                  {user.bio && (
                    <p className="text-sm text-gray-600 mt-3 italic">{user.bio}</p>
                  )}
                </div>

                {/* Admin Action */}
                {isAdmin && (
                  <button
                    onClick={() => togglePin(user.id, user.pinned)}
                    disabled={togglingPin === user.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400"
                  >
                    {togglingPin === user.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        <span>حذف از ویژه</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Users Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">سایر اعضا</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-all p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || 'بدون نام'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {user.role === 'ADMIN' ? 'مدیر' : 'دانش‌آموز'}
                  </p>
                </div>
              </div>

              {user.grade && (
                <p className="text-xs text-gray-600 mb-2">
                  {user.grade}
                  {user.field && ` - ${user.field}`}
                </p>
              )}

              {isAdmin && (
                <button
                  onClick={() => togglePin(user.id, user.pinned)}
                  disabled={togglingPin === user.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400"
                >
                  {togglingPin === user.id ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Star className="w-3 h-3" />
                      <span>افزودن به ویژه</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
              <span>قبلی</span>
            </button>

            <span className="text-gray-600">
              صفحه {page} از {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>بعدی</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

