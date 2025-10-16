import { useMutation } from '@tanstack/react-query';

export function usePresignedUpload(onProgress?: (pct: number) => void) {
  return useMutation({
    mutationFn: async (file: File) => {
      console.log('📤 [usePresignedUpload] Starting upload for:', file.name);
      
      // تلاش برای استفاده از R2 Presigned URL (روش اصلی)
      try {
        const metaRes = await fetch('/api/student/reports/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            contentType: file.type || 'application/octet-stream', 
            size: file.size, 
            originalName: file.name 
          }),
        });

        if (metaRes.ok) {
          console.log('✅ [usePresignedUpload] Got presigned URL');
          const { uploadUrl, fileKey } = await metaRes.json();
          await uploadWithProgress(uploadUrl, file, (pct) => onProgress?.(pct));
          return { fileKey } as { fileKey: string };
        }
        
        console.log('⚠️ [usePresignedUpload] Presigned URL failed, falling back to direct upload');
      } catch (error) {
        console.log('⚠️ [usePresignedUpload] Presigned URL error:', error);
      }

      // Fallback: استفاده از آپلود مستقیم (برای Development)
      console.log('📤 [usePresignedUpload] Using direct upload');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/student/reports/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      const result = await response.json();
      console.log('✅ [usePresignedUpload] Upload complete:', result.fileUrl);
      
      // شبیه‌سازی progress
      if (onProgress) {
        onProgress(100);
      }

      return { 
        fileKey: result.fileKey, 
        fileUrl: result.fileUrl 
      };
    },
  });
}

async function uploadWithProgress(url: string, file: File, onProgress?: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}




