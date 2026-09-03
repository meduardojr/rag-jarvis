import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  asChild?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'label';
    return (
      <Comp
        className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)}
        ref={ref}
        {...props}
      >
        {props.children}
      </Comp>
    );
  }
);
Label.displayName = 'Label';

export { Label };