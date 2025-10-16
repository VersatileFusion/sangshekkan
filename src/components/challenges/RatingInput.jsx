"use client";

import { useState } from "react";

const ratingEmojis = [
  { value: 1, emoji: "😠", label: "خیلی بد", color: "text-red-500" },
  { value: 2, emoji: "😐", label: "بد", color: "text-orange-500" },
  { value: 3, emoji: "😊", label: "متوسط", color: "text-yellow-500" },
  { value: 4, emoji: "😄", label: "خوب", color: "text-green-500" },
  { value: 5, emoji: "🤩", label: "عالی", color: "text-teal-500" },
];

export default function RatingInput({ value, onChange, disabled = false }) {
  const [hoveredValue, setHoveredValue] = useState(null);

  const displayValue = hoveredValue !== null ? hoveredValue : value;
  const selectedRating = ratingEmojis.find(r => r.value === displayValue);

  return (
    <div className="w-full">
      <div className="text-center mb-3">
        <p className="text-sm font-medium text-gray-700 mb-2">
          عملکرد امروز خود را چطور ارزیابی می‌کنید؟
        </p>
        {selectedRating && (
          <div className={`text-sm font-semibold ${selectedRating.color}`}>
            {selectedRating.label}
          </div>
        )}
      </div>
      
      <div className="flex justify-center items-center gap-3">
        {ratingEmojis.map((rating) => (
          <button
            key={rating.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(rating.value)}
            onMouseEnter={() => !disabled && setHoveredValue(rating.value)}
            onMouseLeave={() => !disabled && setHoveredValue(null)}
            className={`
              text-4xl transition-all duration-200 
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-125'}
              ${value === rating.value ? 'scale-110' : 'scale-100 opacity-60'}
              ${hoveredValue === rating.value && !disabled ? 'scale-125' : ''}
            `}
            title={rating.label}
          >
            {rating.emoji}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>خیلی بد</span>
        <span>عالی</span>
      </div>
    </div>
  );
}

