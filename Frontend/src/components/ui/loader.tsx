import * as React from "react";
import { cn } from "./utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars';
}

const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  ({ className, size = 'md', variant = 'spinner', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };

    if (variant === 'spinner') {
      return (
        <div
          ref={ref}
          className={cn("relative inline-flex", sizeClasses[size], className)}
          {...props}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-primary/50 to-transparent animate-spin" />
          <div className="absolute inset-1 rounded-full bg-background/90 backdrop-blur-sm" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-primary/50 to-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      );
    }

    if (variant === 'pulse') {
      return (
        <div
          ref={ref}
          className={cn("relative inline-flex items-center justify-center", sizeClasses[size], className)}
          {...props}
        >
          <div className="absolute rounded-full bg-primary animate-ping opacity-75" style={{ width: '100%', height: '100%' }} />
          <div className="relative rounded-full bg-primary" style={{ width: '60%', height: '60%' }} />
        </div>
      );
    }

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-center justify-center gap-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      );
    }

    if (variant === 'bars') {
      return (
        <div
          ref={ref}
          className={cn("inline-flex items-end justify-center gap-1", sizeClasses[size], className)}
          {...props}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-primary to-primary/50 animate-pulse rounded-full"
              style={{
                height: `${(i + 1) * 25}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      );
    }

    return null;
  }
);

Loader.displayName = "Loader";

// Shimmer effect for loading states
interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  intensity?: 'light' | 'medium' | 'strong';
}

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, width, height, rounded = true, intensity = 'medium', style, ...props }, ref) => {
    const intensityClasses = {
      light: 'bg-white/5',
      medium: 'bg-white/10',
      strong: 'bg-white/20',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          intensityClasses[intensity],
          rounded && "rounded-lg",
          className
        )}
        style={{
          width: width || '100%',
          height: height || '20px',
          ...style,
        }}
        {...props}
      >
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </div>
    );
  }
);

Shimmer.displayName = "Shimmer";

// Skeleton loader for content placeholders
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', lines = 1, ...props }, ref) => {
    if (variant === 'text') {
      return (
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <Shimmer
              key={i}
              height="16px"
              width={i === lines - 1 && lines > 1 ? "80%" : "100%"}
            />
          ))}
        </div>
      );
    }

    if (variant === 'circular') {
      return (
        <Shimmer
          ref={ref}
          className={cn("rounded-full", className)}
          width="48px"
          height="48px"
          {...props}
        />
      );
    }

    if (variant === 'rectangular') {
      return (
        <Shimmer
          ref={ref}
          className={className}
          height="120px"
          {...props}
        />
      );
    }

    if (variant === 'card') {
      return (
        <div ref={ref} className={cn("space-y-4 p-4 glass-surface rounded-xl", className)} {...props}>
          <div className="flex items-center space-x-4">
            <Skeleton variant="circular" />
            <div className="flex-1 space-y-2">
              <Shimmer height="20px" width="40%" />
              <Shimmer height="16px" width="60%" />
            </div>
          </div>
          <Skeleton variant="text" lines={3} />
          <div className="flex gap-2">
            <Shimmer height="32px" width="80px" rounded />
            <Shimmer height="32px" width="80px" rounded />
          </div>
        </div>
      );
    }

    return null;
  }
);

Skeleton.displayName = "Skeleton";

export { Loader, Shimmer, Skeleton };