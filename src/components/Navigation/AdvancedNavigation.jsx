import { useState, useEffect } from "react";
import {
  Home,
  ChevronRight,
  Menu,
  X,
  User,
  BarChart3,
  MapPin,
  Settings,
  Bell,
  LogOut,
  Target,
  MessageCircle,
  Play,
} from "lucide-react";
import useUser from "@/utils/useUser";

export default function AdvancedNavigation({
  currentPage = "",
  breadcrumbs = [],
}) {
  const { data: authUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!authUser) {
      return [
        { name: "صفحه اصلی", href: "/", icon: Home },
        { name: "ورود", href: "/account/signin", icon: User },
      ];
    }

    // Check if user is advisor
    const isAdvisor = authUser.email === "melika.sangshakan@advisor.com";

    if (isAdvisor) {
      return [
        { name: "صفحه اصلی", href: "/", icon: Home },
        { name: "پنل مشاور", href: "/advisor-enhanced", icon: BarChart3 },
        { name: "چت و ویدیو", href: "/chat", icon: User },
        { name: "تنظیمات", href: "/settings", icon: Settings },
        { name: "خروج", href: "/account/logout", icon: LogOut },
      ];
    } else {
      return [
        { name: "صفحه اصلی", href: "/", icon: Home },
        {
          name: "داشبورد دانش‌آموز",
          href: "/student-dashboard",
          icon: BarChart3,
        },
        { name: "چالش‌ها", href: "/challenges", icon: Target },
        { name: "چت و ویدیو", href: "/chat", icon: MessageCircle },
        { name: "ویدیوها", href: "/videos", icon: Play },
        { name: "خروج", href: "/account/logout", icon: LogOut },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Fixed Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200"
            : "bg-gradient-to-r from-teal-500/90 to-cyan-500/90 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className={`flex items-center space-x-2 font-bold text-lg transition-colors ${
                  isScrolled
                    ? "text-gray-800 hover:text-teal-600"
                    : "text-white hover:text-teal-100"
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="mr-2">سامانه مطالعه</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isScrolled
                        ? "text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                        : "text-white hover:text-teal-100 hover:bg-white/20"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="mr-2">{item.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isScrolled
                  ? "text-gray-800 hover:bg-gray-100"
                  : "text-white hover:bg-white/20"
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
              <div className="py-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="mr-3">{item.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <a
                href="/"
                className="text-teal-600 hover:text-teal-700 transition-colors flex items-center"
              >
                <Home className="w-4 h-4 ml-1" />
                خانه
              </a>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      {crumb.name}
                    </a>
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {crumb.name}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Page Title Banner - REMOVED */}
      {/* Floating Action Button - Always visible */}
      <div className="fixed bottom-6 left-6 z-50">
        <a
          href="/"
          className="group bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center"
        >
          <Home className="w-6 h-6" />
          <span className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            صفحه اصلی
          </span>
        </a>
      </div>

      {/* Quick Actions Menu - Desktop Only */}
      {authUser && (
        <div className="hidden lg:block fixed top-1/2 right-6 transform -translate-y-1/2 z-40">
          <div className="space-y-3">
            {navigationItems.slice(1, -1).map((item) => {
              // Exclude home and logout
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="group bg-white hover:bg-teal-50 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center"
                  title={item.name}
                >
                  <Icon className="w-5 h-5 text-teal-600" />
                  <span className="mr-3 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #14b8a6, #06b6d4);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #0d9488, #0891b2);
        }
      `}</style>
    </>
  );
}
