"use client";

import { useEffect, useState } from "react";
import { Heart, Eye, ExternalLink } from "lucide-react";
import { useSession } from "@auth/create/react";

export default function AdminContentGrid() {
  const { data: session } = useSession();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await fetch("/api/content");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContents(data.data || []);
        }
      } else {
        setError("خطا در دریافت محتواها");
      }
    } catch (err) {
      console.error("Error fetching contents:", err);
      setError("خطا در بارگذاری محتواها");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (contentId) => {
    if (!session?.user) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    try {
      const response = await fetch(`/api/content/${contentId}/like`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        // Update UI optimistically
        setContents(prev => prev.map(content => 
          content.id === contentId 
            ? { ...content, isLikedByCurrentUser: data.isLiked, likesCount: data.likesCount }
            : content
        ));
      } else {
        alert(data.error || "خطا در لایک کردن");
      }
    } catch (err) {
      console.error("Error liking content:", err);
      alert("خطا در لایک کردن");
    }
  };

  const handleView = async (content) => {
    try {
      // Increment view count
      await fetch(`/api/content/${content.id}/view`, {
        method: "POST"
      });

      // Update UI
      setContents(prev => prev.map(c => 
        c.id === content.id 
          ? { ...c, views: c.views + 1 }
          : c
      ));

      // Open link if available
      if (content.linkUrl) {
        window.open(content.linkUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Error recording view:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>هنوز محتوایی منتشر نشده است</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contents.map((content) => (
        <div
          key={content.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          {/* Image */}
          <div className="relative w-full h-48 bg-gray-200">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
              }}
            />
            
            {/* View Count Badge */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {content.views}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
              {content.title}
            </h3>

            {/* Description */}
            {content.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {content.description}
              </p>
            )}

            {/* Author & Date */}
            <div className="text-xs text-gray-500 mb-4">
              <span>منتشر شده توسط {content.author?.name || "مدیر"}</span>
              <span className="mx-2">•</span>
              <span>{new Date(content.createdAt).toLocaleDateString("fa-IR")}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              {/* Like Button */}
              <button
                onClick={() => handleLike(content.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  content.isLikedByCurrentUser
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Heart 
                  className={`w-4 h-4 ${content.isLikedByCurrentUser ? "fill-current" : ""}`}
                />
                <span className="text-sm font-medium">{content.likesCount}</span>
              </button>

              {/* View/Link Button */}
              <button
                onClick={() => handleView(content)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium"
              >
                {content.linkUrl ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    مشاهده محتوا
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    مشاهده
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


