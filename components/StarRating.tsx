
import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  disabled?: boolean;
}

const Star: React.FC<{ filled: boolean; onMouseEnter: () => void; onClick: () => void; disabled?: boolean; }> = ({ filled, onMouseEnter, onClick, disabled }) => (
    <svg
        className={`w-8 h-8 ${filled ? 'text-yellow-400' : 'text-gray-400'} ${!disabled ? 'cursor-pointer hover:text-yellow-300' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        onMouseEnter={!disabled ? onMouseEnter : undefined}
        onClick={!disabled ? onClick : undefined}
    >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex" onMouseLeave={() => !disabled && setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          filled={(hoverRating || rating) >= index}
          onMouseEnter={() => !disabled && setHoverRating(index)}
          onClick={() => !disabled && setRating(index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default StarRating;
