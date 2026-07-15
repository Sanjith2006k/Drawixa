import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'default', 
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-hover shadow-md",
    secondary: "bg-glass text-white border border-borderColor hover:bg-white/10",
    ghost: "text-textSecondary hover:text-white hover:bg-white/10",
  };

  const sizes = {
    default: "h-14 px-8 text-base",
    sm: "h-10 px-4 text-sm",
    lg: "h-16 px-10 text-lg",
    icon: "h-14 w-14",
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
