import React from 'react';

export function Badge({ children, className, variant }) {
  const baseStyle = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
    outline: "text-foreground",
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className={`${baseStyle} ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
}


