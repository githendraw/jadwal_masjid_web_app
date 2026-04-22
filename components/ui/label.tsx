'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

function Label({
  className = '',
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={'text-sm font-medium text-foreground transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ' + className}
      {...props}
    />
  );
}

export { Label };
