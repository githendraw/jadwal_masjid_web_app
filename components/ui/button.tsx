import * as React from 'react';

const buttonVariants = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const buttonSizes = {
  default: 'px-4 py-2 rounded-lg',
  sm: 'px-3 py-1 rounded-md text-sm',
  lg: 'px-6 py-3 rounded-lg text-lg',
  icon: 'p-2 rounded-lg',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants[variant]} ${buttonSizes[size]} font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${className}`}
      {...props}
    />
  );
}
