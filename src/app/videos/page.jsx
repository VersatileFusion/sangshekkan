"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Heart,
  MessageCircle,
  Upload,
  Filter,
  User,
  Eye,
  Calendar,
  Plus,
  ThumbsUp,
} from "lucide-react";
import useUser from "@/utils/useUser";
import AdvancedNavigation from "@/components/Navigation/AdvancedNavigation";
import AdminContentGrid from "@/components/content/AdminContentGrid";

export default function VideosPage() {
  const { data: authUser, loading: authLoading } = useUser();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAdvisor, setIsAdvisor] = useState(false);

  // Upload form data
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    video_url: "",
    category: "",
  });

  // Video categories
  const categories = [
    { value: "", label: "همه دسته‌ها" },
    { value: "انگیزشی", label: "انگیزشی" },
    { value: "تکنیک‌های تست‌زنی", label: "تکنیک‌های تست‌زنی" },
    { value: "مدیریت زمان", label: "مدیریت زمان" },
    { value: "آرامش روانی", label: "آرامش روانی" },
    { value: "برنامه‌ریزی", label: "برنامه‌ریزی" },
    { value: "روش مطالعه", label: "روش مطالعه" },
  ];

  // Define breadcrumbs
  const breadcrumbs = [{ name: "ویدیوهای آموزشی", href: null }];

  // Fetch user and check if advisor
  useEffect(() => {
    if (authUser) {
      fetchUserData();
      setIsAdvisor(authUser.email === "melika.sangshakan@advisor.com");
    }
  }, [authUser]);

  // Fetch videos when category changes
  useEffect(() => {
    if (authUser) {
      fetchVideos();
    }
  }, [authUser, selectedCategory]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      let url = "/api/videos";
      if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        console.error("Failed to fetch videos");
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments((prev) => ({
          ...prev,
          [videoId]: data.comments || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleLike = async (videoId, e) => {
    if (e) e.stopPropagation();
    
    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        
        // به‌روزرسانی محلی state
        setVideos(prevVideos => 
          prevVideos.map(v => 
            v.id === videoId 
              ? { ...v, like_count: data.likeCount, user_liked: data.liked }
              : v
          )
        );
        
        // به‌روزرسانی selectedVideo اگر مودال باز است
        if (selectedVideo && selectedVideo.id === videoId) {
          setSelectedVideo(prev => ({
            ...prev,
            like_count: data.likeCount,
            user_liked: data.liked,
          }));
        }
      } else {
        const error = await response.json();
        alert(error.error || "خطا در لایک کردن");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("خطا در لایک کردن");
    }
  };

  const addComment = async (videoId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      if (response.ok) {
        setNewComment("");
        fetchComments(videoId);
        alert("نظر شما پس از تایید مشاور نمایش داده خواهد شد");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در ثبت نظر");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("خطا در ثبت نظر");
    }
  };

  const uploadVideo = async (e) => {
    e.preventDefault();

    if (!uploadData.title || !uploadData.video_url || !uploadData.category) {
      alert("لطفاً تمام فیلدهای ضروری را پر کنید");
      return;
    }

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });

      if (response.ok) {
        setUploadData({
          title: "",
          description: "",
          video_url: "",
          category: "",
        });
        setIsUploadModalOpen(false);
        fetchVideos();
        alert("ویدیو با موفقیت آپلود شد");
      } else {
        const error = await response.json();
        alert(error.error || "خطا در آپلود ویدیو");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("خطا در آپلود ویدیو");
    }
  };

  const openVideoModal = async (video) => {
    setSelectedVideo(video);
    
    // افزایش بازدید
    try {
      await fetch(`/api/videos/${video.id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing view:", error);
    }
  };

  const extractVideoId = (url) => {
    // Extract YouTube video ID from various URL formats
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ورود به سیستم لازم است
          </h2>
          <p className="text-gray-600 mb-4">
            برای دسترسی به ویدیوها، لطفاً وارد شوید
          </p>
          <a
            href="/account/signin"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            ورود به سیستم
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Advanced Navigation */}
      <AdvancedNavigation currentPage="/videos" breadcrumbs={breadcrumbs} />

      <div className="container mx-auto px-4 pb-8 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            محتوای آموزشی و انگیزشی
          </h1>
          <p className="text-gray-600">
            محتواهای مفید برای موفقیت در مطالعه و کنکور
          </p>
        </div>

        {/* Admin Content Grid - جایگزینی بخش ویدیوها */}
        <AdminContentGrid />

      </div>
    </div>
  );
}
