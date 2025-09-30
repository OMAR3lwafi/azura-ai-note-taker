import * as React from "react";
import { cn } from "./utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | '3d-light' | '3d-medium' | '3d-strong' | 'neon' | 'frosted' | 'holographic' | 'floating' | 'magnetic';
  intensity?: 'light' | 'medium' | 'strong';
  depth?: 1 | 2 | 3 | 4 | 5;
  glow?: 'none' | 'blue' | 'purple' | 'cyan' | 'multi';
  tiltOnHover?: boolean;
  animateGradient?: boolean;
  animate?: 'none' | 'float' | 'pulse' | 'shimmer' | 'glow';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ 
    className, 
    variant = 'default', 
    intensity = 'medium', 
    depth,
    glow = 'none',
    tiltOnHover = false,
    animateGradient = false,
    animate = 'none',
    children, 
    ...props 
  }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [tiltStyle, setTiltStyle] = React.useState<React.CSSProperties>({});

    React.useImperativeHandle(ref, () => cardRef.current as HTMLDivElement);

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltOnHover || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      setTiltStyle({
        transform: `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`,
        transition: 'transform 0.1s ease-out',
      });
    }, [tiltOnHover]);

    const handleMouseLeave = React.useCallback(() => {
      if (!tiltOnHover) return;
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 0.3s ease-out',
      });
    }, [tiltOnHover]);

    const intensityClasses = {
      light: 'bg-white/5 backdrop-blur-lg',
      medium: 'bg-white/10 backdrop-blur-xl',
      strong: 'bg-white/15 backdrop-blur-2xl',
    };

    const variantClasses = {
      default: 'border border-white/20',
      elevated: 'border border-white/20 shadow-xl shadow-black/20',
      interactive: 'border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer hover:-translate-y-1',
      '3d-light': 'glass-3d-light rounded-xl',
      '3d-medium': 'glass-3d-medium rounded-xl',
      '3d-strong': 'glass-3d-strong rounded-xl',
      neon: 'glass-neon rounded-xl',
      frosted: 'glass-frosted rounded-xl',
      holographic: 'bg-gradient-to-br from-white/12 to-white/5 backdrop-blur-xl border-2 border-white/20 rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.3)]',
      floating: 'glass-3d-light rounded-xl animate-floating',
      magnetic: 'glass-3d-medium rounded-xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 cursor-pointer',
    };

    const depthClasses = depth ? {
      1: 'shadow-[0_2px_4px_rgba(0,0,0,0.1)]',
      2: 'shadow-[0_4px_8px_rgba(0,0,0,0.15)]',
      3: 'shadow-[0_8px_16px_rgba(0,0,0,0.2)]',
      4: 'shadow-[0_16px_32px_rgba(0,0,0,0.25)]',
      5: 'shadow-[0_24px_48px_rgba(0,0,0,0.3)]',
    }[depth] : '';

    const glowClasses = {
      none: '',
      blue: 'shadow-[0_0_40px_rgba(59,130,246,0.4)]',
      purple: 'shadow-[0_0_40px_rgba(168,85,247,0.4)]',
      cyan: 'shadow-[0_0_40px_rgba(6,182,212,0.4)]',
      multi: 'shadow-[0_0_40px_rgba(59,130,246,0.3),0_0_60px_rgba(168,85,247,0.2)]',
    };

    const animationClasses = {
      none: '',
      float: 'animate-floating',
      pulse: 'animate-subtle-pulse',
      shimmer: 'animate-crystal-shimmer',
      glow: 'animate-glow-pulse',
    };

    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          ...tiltStyle,
          willChange: tiltOnHover ? 'transform' : 'auto',
        }}
        className={cn(
          "glass-surface rounded-xl p-6 relative overflow-hidden transition-all duration-300",
          intensityClasses[intensity],
          variantClasses[variant],
          depthClasses,
          glowClasses[glow],
          animationClasses[animate],
          className
        )}
        {...props}
      >
        {/* Enhanced gradient overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none",
          animateGradient && "animate-crystal-shimmer"
        )} />
        
        {/* Inner glow for depth */}
        {(variant.includes('3d') || variant === 'neon') && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl pointer-events-none" />
        )}
        
        {/* Reflection layer for glass effect */}
        {variant === 'holographic' && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-xl pointer-events-none animate-holographic-shift" />
        )}
        
        {/* Content with proper z-index */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  />
));
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
));
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/70", className)}
    {...props}
  />
));
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
));
GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};