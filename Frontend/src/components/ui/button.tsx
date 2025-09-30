import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        glass3d:
          "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_12px_48px_rgba(0,0,0,0.4),0_4px_12px_rgba(255,255,255,0.15)_inset] hover:-translate-y-1 transition-all duration-300 text-white",
        neon:
          "bg-primary/20 border-2 border-primary text-primary shadow-[0_0_20px_var(--primary-glow),0_0_40px_var(--primary-glow)] hover:shadow-[0_0_30px_var(--primary-glow),0_0_60px_var(--primary-glow)] animate-glow-pulse",
        gradient3d:
          "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0",
        magnetic:
          "bg-white/12 backdrop-blur-xl border border-white/20 hover:-translate-y-2 hover:scale-105 transition-all duration-200 ease-out shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] text-white",
        holographic:
          "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-[length:200%_100%] animate-crystal-shimmer text-white shadow-xl border-0",
        floating:
          "bg-white/8 backdrop-blur-md border border-white/15 animate-floating shadow-lg text-white",
        frosted:
          "bg-white/5 backdrop-blur-2xl border border-white/10 text-white hover:bg-white/10 transition-all duration-300",
        crystal:
          "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(30,58,138,0.3)] hover:shadow-[0_12px_48px_rgba(30,58,138,0.5)] text-white transition-all duration-300",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
        "2xl": "h-14 rounded-xl px-10 text-lg has-[>svg]:px-8",
        icon: "size-9 rounded-md",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-md",
        "icon-xl": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
