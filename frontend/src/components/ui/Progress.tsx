'use client';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function Progress({
  value,
  max = 100,
  className = '',
  showLabel = false,
  size = 'md',
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative ${heights[size]} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className="absolute h-full bg-gradient-to-r from-accent to-violet rounded-full transition-all duration-500 ease-smooth"
          style={{ width: `${percentage}%` }}
        />
        {/* Shimmer effect */}
        <div
          className="absolute h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-2 text-tiny text-slate-400 text-right font-medium">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}
