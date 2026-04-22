import * as React from 'react';

function Button({
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm px-4 py-2.5 text-sm font-semibold',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-4 py-2.5 text-sm',
    ghost: 'hover:bg-muted hover:text-foreground px-3 py-2 text-sm',
    outline: 'border border-border bg-transparent hover:bg-muted px-4 py-2.5 text-sm',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/80 px-4 py-2.5 text-sm font-semibold',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export { Button };
