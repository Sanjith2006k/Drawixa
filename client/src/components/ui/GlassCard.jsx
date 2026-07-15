import React from 'react';
import { cn } from '../../utils/cn';

export function GlassCard({ className, children, ...props }) {
  return (
    <div 
      className={cn("bg-glass border border-borderColor backdrop-blur-md rounded-2xl shadow-lg p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
