import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-button text-button-foreground shadow hover:bg-button-hover",
        destructive: "bg-button text-button-foreground shadow-sm hover:bg-button-hover",
        outline:
          "border border-button bg-button text-button-foreground shadow-sm hover:bg-button-hover",
        secondary: "bg-button text-button-foreground shadow-sm hover:bg-button-hover",
        ghost: "bg-button text-button-foreground hover:bg-button-hover",
        link: "bg-button text-button-foreground underline-offset-4 hover:underline hover:bg-button-hover",
      },
      size: {
        default: "min-h-10 px-3.5 py-1.5",
        sm: "min-h-9 rounded-md px-3 text-[13px]",
        lg: "min-h-11 rounded-md px-5 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
