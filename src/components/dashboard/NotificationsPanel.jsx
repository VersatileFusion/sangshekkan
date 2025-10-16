import { Bell } from "lucide-react";
import { toPersianDate } from "@/utils/persianDate";

export default function NotificationsPanel({ notifications, onMarkAsRead }) {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto border border-gray-100">
      <div className="p-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
        <h3 className="font-bold text-gray-800">🔔 اعلانات</h3>
      </div>
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>اعلانی وجود ندارد</p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {notifications.slice(0, 10).map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.is_read
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
              onClick={() => onMarkAsRead([notification.id])}
            >
              <h4 className="font-semibold text-sm text-gray-800 mb-1">
                {notification.title}
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400">
                📅 {toPersianDate(notification.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
