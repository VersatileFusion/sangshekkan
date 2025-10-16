"use client";

import { useState, useRef } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function TestUpload() {
  const [uploadedUrl, setUploadedUrl] = useState("");
  const { uploading, uploadImage } = useImageUpload();
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name, file.type, file.size);
      const url = await uploadImage(file);
      if (url) {
        setUploadedUrl(url);
        console.log("Upload successful, URL:", url);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">تست آپلود تصویر</h1>
        
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {uploading ? "در حال آپلود..." : "انتخاب فایل"}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {uploadedUrl && (
            <div className="space-y-4">
              <p className="text-green-600 font-bold">آپلود موفق!</p>
              <img 
                src={uploadedUrl} 
                alt="Uploaded" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-xs text-gray-500 break-all">{uploadedUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}