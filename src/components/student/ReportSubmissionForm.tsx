import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usePresignedUpload } from '@/hooks/student/usePresignedUpload';
import { useCreateReport } from '@/hooks/student/useStudentReports';

type FormValues = {
  date: string;
  subject?: string;
  testSource?: string;
  testCount: number;
  studyHours: number;
  notes?: string;
  file?: FileList;
};

const schema = yup.object({
  date: yup.string().required(),
  testCount: yup.number().min(0).required(),
  studyHours: yup.number().min(0).required(),
  subject: yup.string().optional(),
  testSource: yup.string().optional(),
  notes: yup.string().optional(),
});

export default function ReportSubmissionForm() {
  const [progress, setProgress] = React.useState(0);
  const upload = usePresignedUpload(setProgress);
  const createReport = useCreateReport();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0,10), testCount: 0, studyHours: 0 },
  });

  const onSubmit = async (values: FormValues) => {
    let fileKey: string | undefined;
    let fileUrl: string | undefined;
    const file = values.file?.[0];
    if (file) {
      const res = await upload.mutateAsync(file);
      fileKey = res.fileKey;
      fileUrl = res.fileUrl; // دریافت fileUrl از آپلود محلی
    }
    await createReport.mutateAsync({
      date: values.date,
      subject: values.subject,
      testSource: values.testSource,
      testCount: values.testCount,
      studyHours: values.studyHours,
      notes: values.notes,
      fileKey, // برای R2
      fileUrl, // برای Local
    });
    setProgress(0);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">تاریخ</label>
          <input type="date" className="w-full border rounded-md px-3 py-2" {...register('date')} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">تعداد تست</label>
          <input type="number" className="w-full border rounded-md px-3 py-2" {...register('testCount', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ساعت مطالعه</label>
          <input type="number" step="0.1" className="w-full border rounded-md px-3 py-2" {...register('studyHours', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">موضوع</label>
          <input type="text" className="w-full border rounded-md px-3 py-2" {...register('subject')} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">منبع تست</label>
          <input type="text" className="w-full border rounded-md px-3 py-2" {...register('testSource')} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">توضیحات</label>
          <textarea className="w-full border rounded-md px-3 py-2" rows={3} {...register('notes')} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">فایل ضمیمه (اختیاری)</label>
          <input type="file" className="w-full" {...register('file')} />
          {progress > 0 && (
            <div className="mt-2 w-full bg-gray-100 h-2 rounded">
              <div className="bg-teal-600 h-2 rounded" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button disabled={isSubmitting} type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md disabled:opacity-50">ثبت گزارش</button>
      </div>
    </form>
  );
}




