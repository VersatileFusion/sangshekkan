import { useState } from "react";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    if (!file) return null;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Upload successful:", data);
        return data.url;
      } else {
        console.error("Upload failed:", data);
        alert(data.error || "خطا در آپلود تصویر");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("خطا در ارتباط با سرور برای آپلود تصویر");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadImage };
}
