"use client";
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminVideos, useCreateVideo, useUpdateVideo, useDeleteVideo } from '@/hooks/admin/useAdminChallengesVideos';
import { PlusCircle, Edit, Trash2, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type VideoForm = {
  title: string;
  category: string;
  videoUrl: string;
  thumbnailUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
};

type LinkPreview = {
  title: string | null;
  description: string | null;
  image: string | null;
  platform?: string;
} | null;

export default function VideosPage() {
  const [page, setPage] = React.useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data, isLoading } = useAdminVideos(page, selectedCategory);
  const createMutation = useCreateVideo();
  const updateMutation = useUpdateVideo();
  const deleteMutation = useDeleteVideo();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>({
    title: '',
    category: '',
    videoUrl: '',
  });
  const [linkPreview, setLinkPreview] = useState<LinkPreview>(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  // دسته‌بندی‌های ثابت ویدیو (برای فیلتر)
  const filterCategories = [
    { value: 'all', label: 'همه دسته‌ها' },
    { value: 'آموزشی', label: 'آموزشی' },
    { value: 'انگیزشی', label: 'انگیزشی' },
    { value: 'تکنیک مطالعه', label: 'تکنیک مطالعه' },
    { value: 'تکنیک‌های تست‌زنی', label: 'تکنیک‌های تست‌زنی' },
    { value: 'مدیریت زمان', label: 'مدیریت زمان' },
    { value: 'روانشناسی', label: 'روانشناسی' },
    { value: 'برنامه‌ریزی', label: 'برنامه‌ریزی' },
    { value: 'روش مطالعه', label: 'روش مطالعه' },
    { value: 'آرامش روانی', label: 'آرامش روانی' },
  ];

  // دسته‌بندی‌ها برای فرم (بدون گزینه "همه")
  const formCategories = filterCategories.filter(cat => cat.value !== 'all');

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: '',
      category: '',
      videoUrl: '',
    });
    setLinkPreview(null);
    setShowModal(true);
  };

  const openEdit = (video: any) => {
    setEditingId(video.id);
    setForm({
      title: video.title,
      category: video.category,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      videoTitle: video.videoTitle,
      videoDescription: video.videoDescription,
    });
    
    // Set preview if exists
    if (video.thumbnailUrl || video.videoTitle) {
      setLinkPreview({
        title: video.videoTitle,
        description: video.videoDescription,
        image: video.thumbnailUrl,
      });
    } else {
      setLinkPreview(null);
    }
    
    setShowModal(true);
  };

  // Fetch link preview
  const fetchLinkPreview = async (url: string) => {
    if (!url || url.trim().length === 0) {
      setLinkPreview(null);
      return;
    }

    setFetchingPreview(true);
    
    try {
      const response = await fetch('/api/admin/unfurl-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: url.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setLinkPreview(data);
        
        // Update form with preview data
        setForm(prev => ({
          ...prev,
          thumbnailUrl: data.image || undefined,
          videoTitle: data.title || undefined,
          videoDescription: data.description || undefined,
        }));
      } else {
        toast.error('خطا در دریافت پیش‌نمایش لینک');
        setLinkPreview(null);
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
      setLinkPreview(null);
    } finally {
      setFetchingPreview(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: form });
        toast.success('ویدیو با موفقیت به‌روزرسانی شد');
      } else {
        await createMutation.mutateAsync(form);
        toast.success('ویدیو با موفقیت ایجاد شد');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('خطا در ذخیره ویدیو');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('ویدیو حذف شد');
    } catch (error) {
      toast.error('خطا در حذف ویدیو');
    }
  };

  return (
    <AdminLayout current="videos">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">مدیریت ویدیوها</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>ویدیو جدید</span>
          </button>
        </div>

        {/* فیلتر دسته‌بندی */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">فیلتر بر اساس دسته‌بندی:</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1); // Reset to first page when category changes
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            {filterCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {selectedCategory !== 'all' && (
            <span className="text-sm text-gray-500">
              ({total} ویدیو)
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">هیچ ویدیویی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">عنوان</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">دسته‌بندی</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">آپلودکننده</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">تاریخ</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((video: any) => (
                  <tr key={video.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {video.title}
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {video.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {video.uploadedBy?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(video.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(video)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
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
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? 'ویرایش ویدیو' : 'ویدیو جدید'}
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
                  عنوان ویدیو
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="مثال: آموزش تکنیک‌های مطالعه"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                  required
                >
                  <option value="" disabled>یک دسته‌بندی را انتخاب کنید</option>
                  {formCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  لینک ویدیو
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  onBlur={(e) => fetchLinkPreview(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                  dir="ltr"
                />
                
                {/* Link Preview Card */}
                {fetchingPreview && (
                  <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
                    <div className="text-sm text-gray-500">در حال بارگذاری پیش‌نمایش...</div>
                  </div>
                )}
                
                {linkPreview && !fetchingPreview && (
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    {linkPreview.image && (
                      <div className="w-full h-48 bg-gray-100">
                        <img
                          src={linkPreview.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {linkPreview.title && (
                        <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                          {linkPreview.title}
                        </h4>
                      )}
                      {linkPreview.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {linkPreview.description}
                        </p>
                      )}
                      {linkPreview.platform && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          <ExternalLink className="w-3 h-3" />
                          <span>{linkPreview.platform}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
    </AdminLayout>
  );
}

