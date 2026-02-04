'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-medium
      transition-all duration-300 ease-smooth
      focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      overflow-hidden
    `;

    const variants = {
      primary: `
        bg-gradient-to-br from-accent to-violet text-white
        hover:shadow-[0_8px_24px_-4px_rgba(99,102,241,0.4)]
        hover:-translate-y-0.5 active:translate-y-0
        rounded-2xl
      `,
      secondary: `
        bg-white text-slate-700 border border-slate-200
        hover:border-slate-300 hover:shadow-soft
        hover:-translate-y-0.5 active:translate-y-0
        rounded-2xl
      `,
      ghost: `
        text-slate-600 hover:text-slate-900
        hover:bg-slate-100/80
        rounded-xl
      `,
      soft: `
        bg-accent-soft/30 text-accent
        hover:bg-accent-soft/50
        rounded-2xl
      `,
    };

    const sizes = {
      sm: 'px-4 py-2 text-caption gap-1.5',
      md: 'px-6 py-3 text-body gap-2',
      lg: 'px-8 py-4 text-subtitle gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
