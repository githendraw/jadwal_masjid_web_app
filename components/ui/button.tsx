'use client';

import * as React from 'react';

function Button({
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
}) {
  return (
    <button
      className={['btn', 'btn-' + variant, className].join(' ')}
      {...props}
    />
  );
}

export { Button };
