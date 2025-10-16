import React from 'react';
import { Home, Users, FileText, Trophy, Video, MessageCircle } from 'lucide-react';
import AdminProfileDropdown from './AdminProfileDropdown';

type Props = { children: React.ReactNode; current?: 'dashboard'|'students'|'reports'|'challenges'|'videos'|'profile'|'settings'|'security'|'messages' };

export default function AdminLayout({ children, current='dashboard' }: Props) {
  const item = (href: string, label: string, key: Props['current'], icon: React.ReactNode) => (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        current===key
          ? 'bg-teal-500 text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">پنل مدیریت خانم سنگ‌شکن</h1>
              <p className="text-sm text-gray-600 mt-1">سامانه گزارش‌گیری مطالعه</p>
            </div>
            <AdminProfileDropdown />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <nav className="space-y-2 bg-white rounded-xl shadow-md p-4 sticky top-8">
              <div className="text-sm font-semibold text-gray-500 mb-3 px-2">منوی اصلی</div>
              {item('/admin', 'داشبورد', 'dashboard', <Home className="w-5 h-5" />)}
              {item('/admin/students', 'دانش‌آموزان', 'students', <Users className="w-5 h-5" />)}
              {item('/admin/reports', 'گزارش‌ها', 'reports', <FileText className="w-5 h-5" />)}
              {item('/admin/challenges', 'چالش‌ها', 'challenges', <Trophy className="w-5 h-5" />)}
              {item('/admin/videos', 'ویدیوها', 'videos', <Video className="w-5 h-5" />)}
              {item('/admin/messages', 'مدیریت پیام‌ها', 'messages', <MessageCircle className="w-5 h-5" />)}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}




