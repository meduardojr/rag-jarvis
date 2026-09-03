import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const Switch = SwitchPrimitive.Root;

const SwitchThumb = SwitchPrimitive.Thumb;

const SwitchView = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { checked?: boolean }
>(({ className, checked, ...props }, ref) => (
  <Switch
    ref={ref}
    checked={checked ?? false}
    className={cn(
      'inline-flex h-4 w-9 items-center shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-primary/5 data-[state=checked]:bg-primary',
      className
    )}
    {...props}
  >
    <SwitchThumb
      className={cn(
        'block h-3 w-3 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-4'
      )}
    />
  </Switch>
));
SwitchView.displayName = SwitchPrimitive.Root.displayName;

export { Switch, SwitchView as Switch };