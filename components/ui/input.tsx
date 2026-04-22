import * as React from 'react';

function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={['input', className].join(' ')}
      {...props}
    />
  );
}

export { Input };
