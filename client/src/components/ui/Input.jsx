import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full h-14 bg-surface border border-borderColor rounded-2xl px-4 py-2 text-base text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
