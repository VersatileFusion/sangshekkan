"use client";
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminChallenges, useCreateChallenge, useUpdateChallenge, useDeleteChallenge } from '@/hooks/admin/useAdminChallengesVideos';
import { PlusCircle, Edit, Trash2, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import ChallengeParticipantsModal from '@/components/admin/ChallengeParticipantsModal';

type ChallengeForm = {
  title: string;
  description: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
};

export default function ChallengesPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useAdminChallenges(page);
  const createMutation = useCreateChallenge();
  const updateMutation = useUpdateChallenge();
  const deleteMutation = useDeleteChallenge();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [form, setForm] = useState<ChallengeForm>({
    title: '',
    description: '',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      isActive: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const openEdit = (challenge: any) => {
    setEditingId(challenge.id);
    setForm({
      title: challenge.title,
      description: challenge.description,
      isActive: challenge.isActive,
      startDate: new Date(challenge.startDate).toISOString().slice(0, 16),
      endDate: new Date(challenge.endDate).toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form });
        toast.success('چالش با موفقیت به‌روزرسانی شد');
      } else {
        await createMutation.mutateAsync(form);
        toast.success('چالش با موفقیت ایجاد شد');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('خطا در ذخیره چالش');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('چالش حذف شد');
    } catch (error) {
      toast.error('خطا در حذف چالش');
    }
  };

  return (
    <AdminLayout current="challenges">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">مدیریت چالش‌ها</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>چالش جدید</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">هیچ چالشی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">عنوان</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">وضعیت</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">تاریخ شروع</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">تاریخ پایان</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">شرکت‌کنندگان</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((challenge: any) => (
                  <tr key={challenge.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{challenge.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          challenge.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {challenge.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(challenge.startDate).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(challenge.endDate).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {challenge.participationsCount || 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedChallengeId(challenge.id)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="مشاهده شرکت‌کنندگان"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(challenge)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(challenge.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
          >
            قبلی
          </button>
          <div className="text-sm text-gray-600">
            صفحه {page} از {totalPages}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
          >
            بعدی
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'ویرایش چالش' : 'چالش جدید'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  عنوان چالش
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="مثال: چالش مطالعه ۳۰ روزه"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="توضیحات چالش را وارد کنید..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    تاریخ شروع
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    تاریخ پایان
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 text-teal-500 focus:ring-teal-500 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  چالش فعال باشد
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                {editingId ? 'به‌روزرسانی' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {selectedChallengeId && (
        <ChallengeParticipantsModal
          challengeId={selectedChallengeId}
          onClose={() => setSelectedChallengeId(null)}
        />
      )}
    </AdminLayout>
  );
}

