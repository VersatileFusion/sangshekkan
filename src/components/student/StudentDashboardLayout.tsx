import React, { useEffect } from 'react';
// @ts-ignore
import { useSession } from '@auth/create/react';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

type Props = { children: React.ReactNode; current?: 'dashboard' | 'reports' | 'challenges' | 'chat' | 'profile' | 'settings' };

export default function StudentDashboardLayout({ children, current = 'dashboard' }: Props) {
  const { data: session, status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Wait for session to finish loading before any redirect
    if (status === 'loading') {
      console.log('[StudentDashboard] Session loading...');
      return;
    }

    // ✅ After loading completes, check authentication
    if (status === 'unauthenticated' || !session?.user) {
      console.log('[StudentDashboard] No session found, redirecting to signin');
      console.log('[StudentDashboard] Session status:', status);
      console.log('[StudentDashboard] Session data:', session);
      console.log('[StudentDashboard] Cookies:', document.cookie);
      navigate('/account/signin', { replace: true });
      return;
    }

    // ✅ Validate user role (allow STUDENT and ADMIN only)
    const role = (session as any)?.user?.role;
    console.log('[StudentDashboard] Session loaded:', { 
      userId: session.user.id, 
      role, 
      status,
      fullSession: session
    });

    // If role is not available in session, try to get it from the user data
    if (!role) {
      console.log('[StudentDashboard] Role not found in session, checking user data...');
      // Role will be handled by the useUser hook, so we'll allow access for now
      // The dashboard will show appropriate content based on the user's actual role
    } else if (role !== 'STUDENT' && role !== 'ADMIN') {
      console.log('[StudentDashboard] Invalid role, redirecting to home');
      navigate('/', { replace: true });
      return;
    }
  }, [session, status, navigate]);

  // ✅ Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // ✅ Don't render children until session is confirmed
  if (status === 'unauthenticated' || !session?.user) {
    return null; // Will redirect in useEffect
  }
  const Link = (props: any) => <a {...props} />;
  const item = (href: string, label: string, key: Props['current']) => (
    <Link href={href} className={`block px-4 py-2 rounded-md ${current === key ? 'bg-teal-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{label}</Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Profile Dropdown */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">داشبورد دانش‌آموز</h1>
            <ProfileDropdown />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <nav className="space-y-2 bg-white rounded-xl shadow p-3">
            {item('/student-dashboard', 'داشبورد', 'dashboard')}
            {item('/student-dashboard/reports', 'گزارش‌ها', 'reports')}
            {item('/challenges', 'چالش‌ها', 'challenges')}
            {item('/chat', 'گفتگو', 'chat')}
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}




