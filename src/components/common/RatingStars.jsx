import React from "react";
import { Star } from "lucide-react";

export const RatingStars = ({
  value = 0,
  onChange = null,
  max = 5,
  size = "md",
  showLabel = true,
  disabled = false,
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const starSize = sizes[size] || sizes.md;

  const handleStarClick = (index) => {
    if (onChange && !disabled) {
      onChange(index);
    }
  };

  const ratingDescriptions = {
    1: "Very Unsatisfied",
    2: "Unsatisfied",
    3: "Neutral",
    4: "Satisfied",
    5: "Very Satisfied",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((starIndex) => {
          const isFilled = starIndex <= value;
          return (
            <button
              key={starIndex}
              type="button"
              disabled={disabled || !onChange}
              onClick={() => handleStarClick(starIndex)}
              className={`transition-all duration-150 rounded p-0.5 ${
                onChange && !disabled
                  ? "hover:scale-125 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                  : "cursor-default"
              }`}
            >
              <Star
                className={`${starSize} ${
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "fill-slate-100 text-slate-300"
                }`}
              />
            </button>
          );
        })}

        {showLabel && (
          <span className="ml-2 text-xs font-semibold text-slate-600">
            {value > 0 ? `${value} / ${max}` : "Not Rated"}
          </span>
        )}
      </div>

      {onChange && value > 0 && ratingDescriptions[value] && (
        <span className="text-xs font-medium text-indigo-600">
          {ratingDescriptions[value]}
        </span>
      )}
    </div>
  );
};
