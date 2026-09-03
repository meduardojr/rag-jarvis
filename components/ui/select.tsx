import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectTrigger = SelectPrimitive.Trigger;
const SelectContent = SelectPrimitive.Content;
const SelectItem = SelectPrimitive.Item;
const SelectValue = SelectPrimitive.Value;

const SelectGroup = SelectPrimitive.Group;
const SelectLabel = SelectPrimitive.Label;
const SelectSeparator = SelectPrimitive.Separator;

const SelectPortal = SelectPrimitive.Portal;

const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;
const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;

const SelectTriggerWrapper = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : SelectPrimitive.Trigger;
  return (
    <Comp
      className={cn(
        'align-items-center flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
SelectTriggerWrapper.displayName = SelectPrimitive.Trigger.displayName;

const SelectContentWrapper = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPortal>
    <SelectContent
      align="start"
      className={cn(
        'relative z-50 max-h-[25vh] min-w-[8 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      position={position}
      ref={ref}
      {...props}
    >
      {children}
    </SelectContent>
  </SelectPortal>
));
SelectContentWrapper.displayName = SelectPrimitive.Content.displayName;

export {
  Select,
  SelectTriggerWrapper as SelectTrigger,
  SelectContentWrapper as SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};