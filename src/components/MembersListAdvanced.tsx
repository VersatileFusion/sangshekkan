'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Phone, GraduationCap, MapPin, Briefcase, Pin, Loader } from 'lucide-react';
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

export default function MembersListAdvanced() {
  const { data: session } = useSession();
  const [pinnedUsers, setPinnedUsers] = useState<UserData[]>([]);
  const [otherUsers, setOtherUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [togglingPin, setTogglingPin] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const isAdmin = (session as any)?.user?.role === 'ADMIN';

  // Initial load
  useEffect(() => {
    fetchInitialUsers();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchMoreUsers();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, nextCursor]);

  const fetchInitialUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/list?limit=10', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPinnedUsers(data.pinnedUsers || []);
        setOtherUsers(data.otherUsers || []);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreUsers = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await fetch(`/api/users/list?limit=10&cursor=${nextCursor}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOtherUsers(prev => [...prev, ...(data.otherUsers || [])]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching more users:', error);
    } finally {
      setLoadingMore(false);
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
        // Move user between lists
        if (currentPinned) {
          // Remove from pinned, add to others
          const user = pinnedUsers.find(u => u.id === userId);
          if (user) {
            setPinnedUsers(prev => prev.filter(u => u.id !== userId));
            setOtherUsers(prev => [{ ...user, pinned: false }, ...prev]);
          }
        } else {
          // Remove from others, add to pinned
          const user = otherUsers.find(u => u.id === userId);
          if (user) {
            setOtherUsers(prev => prev.filter(u => u.id !== userId));
            setPinnedUsers(prev => [...prev, { ...user, pinned: true }]);
          }
        }
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

  const PinIcon = ({ isPinned, onClick, isLoading }: { isPinned: boolean; onClick: () => void; isLoading: boolean }) => {
    if (!isAdmin) return null;

    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`absolute top-3 left-3 p-2 rounded-full transition-all ${
          isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : isPinned
            ? 'bg-yellow-500 hover:bg-yellow-600 shadow-md'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        title={isPinned ? 'حذف از تگ شده‌ها' : 'افزودن به تگ شده‌ها'}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 text-white animate-spin" />
        ) : (
          <Pin className={`w-4 h-4 ${isPinned ? 'text-white fill-white' : 'text-gray-600'}`} />
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pinned Users Section - Fixed at top */}
      {pinnedUsers.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border-2 border-yellow-200">
          <div className="flex items-center gap-3 mb-6">
            <Pin className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-800">اعضای تگ شده</h2>
            <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-medium rounded-full">
              {pinnedUsers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pinnedUsers.map((user) => (
              <div
                key={user.id}
                className="relative bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all border-2 border-yellow-300"
              >
                <PinIcon 
                  isPinned={true} 
                  onClick={() => togglePin(user.id, true)}
                  isLoading={togglingPin === user.id}
                />

                {/* Header with Avatar */}
                <div className="flex items-start gap-4 mb-4 mt-2">
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
                <div className="space-y-2">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Users Section - Scrollable */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">سایر اعضا</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherUsers.map((user) => (
            <div
              key={user.id}
              className="relative bg-white rounded-lg shadow hover:shadow-md transition-all p-4"
            >
              <PinIcon 
                isPinned={false} 
                onClick={() => togglePin(user.id, false)}
                isLoading={togglingPin === user.id}
              />

              <div className="flex items-center gap-3 mb-3 mt-2">
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
                <p className="text-xs text-gray-600">
                  {user.grade}
                  {user.field && ` - ${user.field}`}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Loading indicator for infinite scroll */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <Loader className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        )}

        {/* Intersection observer target */}
        {hasMore && (
          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
          </div>
        )}

        {/* End of list message */}
        {!hasMore && otherUsers.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">همه کاربران نمایش داده شدند</p>
          </div>
        )}

        {/* Empty state */}
        {!hasMore && otherUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">کاربری یافت نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

