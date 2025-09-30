"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "./utils";

export interface Modal3DProps {
  variant?: 'glass' | 'neon' | 'floating' | 'centered' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal3D = DialogPrimitive.Root;

const Modal3DTrigger = DialogPrimitive.Trigger;

const Modal3DPortal = DialogPrimitive.Portal;

const Modal3DClose = DialogPrimitive.Close;

const Modal3DOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/60 backdrop-blur-xl",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "particles-bg",
      className
    )}
    {...props}
  />
));
Modal3DOverlay.displayName = DialogPrimitive.Overlay.displayName;

const Modal3DContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & Modal3DProps
>(({ className, variant = 'glass', size = 'md', children, ...props }, ref) => {
  const variantClasses = {
    glass: cn(
      'bg-black/40 backdrop-blur-2xl',
      'border border-white/20',
      'shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_2px_8px_rgba(255,255,255,0.1)]'
    ),
    neon: cn(
      'bg-black/50 backdrop-blur-xl',
      'border-2 border-primary',
      'shadow-[0_0_40px_var(--primary-glow),0_24px_80px_rgba(0,0,0,0.5)]',
      'animate-glow-pulse'
    ),
    floating: cn(
      'bg-white/8 backdrop-blur-2xl',
      'border border-white/20',
      'shadow-[0_32px_96px_rgba(0,0,0,0.6)]',
      'animate-floating'
    ),
    centered: cn(
      'bg-gradient-to-br from-white/12 to-white/5 backdrop-blur-2xl',
      'border border-white/25',
      'shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(59,130,246,0.2)]'
    ),
    fullscreen: cn(
      'bg-black/80 backdrop-blur-3xl',
      'border-0',
      'shadow-none'
    ),
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  return (
    <Modal3DPortal>
      <Modal3DOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50',
          'translate-x-[-50%] translate-y-[-50%]',
          'w-full rounded-2xl p-0',
          'grid gap-4',
          'duration-300',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl" />
        
        {/* Shimmer effect for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

        {children}

        {/* Close button */}
        <DialogPrimitive.Close className={cn(
          "absolute right-4 top-4 z-10",
          "rounded-lg p-2",
          "bg-white/10 hover:bg-white/20 backdrop-blur-md",
          "border border-white/20",
          "text-white/70 hover:text-white",
          "transition-all duration-200",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          "disabled:pointer-events-none disabled:opacity-50"
        )}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </Modal3DPortal>
  );
});
Modal3DContent.displayName = DialogPrimitive.Content.displayName;

const Modal3DHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 px-6 pt-6",
      "border-b border-white/10 pb-4",
      className
    )}
    {...props}
  />
);
Modal3DHeader.displayName = "Modal3DHeader";

const Modal3DTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      "text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80",
      "text-3d",
      className
    )}
    {...props}
  />
));
Modal3DTitle.displayName = DialogPrimitive.Title.displayName;

const Modal3DDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/70 leading-relaxed", className)}
    {...props}
  />
));
Modal3DDescription.displayName = DialogPrimitive.Description.displayName;

const Modal3DBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 py-4 overflow-y-auto",
      "max-h-[60vh]",
      "luxury-scrollbar",
      className
    )}
    {...props}
  />
);
Modal3DBody.displayName = "Modal3DBody";

const Modal3DFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row gap-3 px-6 pb-6 pt-4",
      "border-t border-white/10",
      "sm:justify-end",
      className
    )}
    {...props}
  />
);
Modal3DFooter.displayName = "Modal3DFooter";

export {
  Modal3D,
  Modal3DTrigger,
  Modal3DPortal,
  Modal3DOverlay,
  Modal3DContent,
  Modal3DHeader,
  Modal3DTitle,
  Modal3DDescription,
  Modal3DBody,
  Modal3DFooter,
  Modal3DClose,
};
