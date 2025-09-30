import * as React from "react";
import { cn } from "./utils";

export interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'neon' | 'holographic' | 'frosted' | 'crystal';
  depth?: 1 | 2 | 3 | 4 | 5;
  tiltEnabled?: boolean;
  tiltIntensity?: number;
  glowColor?: string;
  animated?: boolean;
  interactive?: boolean;
}

const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  ({ 
    className, 
    variant = 'glass',
    depth = 2,
    tiltEnabled = false,
    tiltIntensity = 0.3,
    glowColor,
    animated = false,
    interactive = false,
    children,
    onMouseMove: userOnMouseMove,
    onMouseEnter: userOnMouseEnter,
    onMouseLeave: userOnMouseLeave,
    ...props 
  }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = React.useState(false);

    React.useImperativeHandle(ref, () => cardRef.current as HTMLDivElement);

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (tiltEnabled && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        
        setMousePosition({ x, y });
      }
      
      if (userOnMouseMove) {
        userOnMouseMove(e);
      }
    }, [tiltEnabled, userOnMouseMove]);

    const handleMouseLeave = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setMousePosition({ x: 0, y: 0 });
      setIsHovered(false);
      
      if (userOnMouseLeave) {
        userOnMouseLeave(e);
      }
    }, [userOnMouseLeave]);

    const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      
      if (userOnMouseEnter) {
        userOnMouseEnter(e);
      }
    }, [userOnMouseEnter]);

    const tiltStyle = tiltEnabled ? {
      transform: `perspective(1000px) rotateX(${-mousePosition.y * 15 * tiltIntensity}deg) rotateY(${mousePosition.x * 15 * tiltIntensity}deg) scale(${isHovered ? 1.02 : 1})`,
      transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
    } : {};

    const variantClasses = {
      glass: cn(
        'bg-white/5 backdrop-blur-xl border border-white/20',
        'shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.1)]'
      ),
      neon: cn(
        'bg-white/8 backdrop-blur-lg border-2',
        !glowColor && 'border-primary',
        'shadow-[0_0_30px_var(--primary-glow)] animate-neon-pulse'
      ),
      holographic: cn(
        'bg-gradient-to-br from-white/12 to-white/5 backdrop-blur-xl',
        'border border-white/30',
        'shadow-[0_8px_40px_rgba(59,130,246,0.4)]',
        'relative overflow-hidden'
      ),
      frosted: cn(
        'bg-white/6 backdrop-blur-2xl border border-white/12',
        'shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.12)]'
      ),
      crystal: cn(
        'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md',
        'border border-white/30',
        'shadow-[0_8px_32px_rgba(30,58,138,0.3)]'
      ),
    };

    const depthClasses = {
      1: 'shadow-[0_2px_4px_rgba(0,0,0,0.1)]',
      2: 'shadow-[0_4px_8px_rgba(0,0,0,0.15)]',
      3: 'shadow-[0_8px_16px_rgba(0,0,0,0.2)]',
      4: 'shadow-[0_16px_32px_rgba(0,0,0,0.25)]',
      5: 'shadow-[0_24px_48px_rgba(0,0,0,0.3)]',
    };

    const shadowOffset = tiltEnabled ? {
      x: mousePosition.x * 10,
      y: mousePosition.y * 10,
    } : { x: 0, y: 0 };

    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{
          ...tiltStyle,
          willChange: tiltEnabled ? 'transform' : 'auto',
          ...(variant === 'neon' && glowColor ? { borderColor: glowColor } : {}),
        }}
        className={cn(
          'rounded-2xl p-6 relative overflow-hidden',
          'transition-all duration-300',
          variantClasses[variant],
          depthClasses[depth],
          animated && 'animate-floating',
          interactive && 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer',
          className
        )}
        {...props}
      >
        {/* Dynamic lighting highlight */}
        {tiltEnabled && isHovered && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%, rgba(255,255,255,0.15), transparent 50%)`,
              transition: 'background 0.1s ease-out',
            }}
          />
        )}

        {/* Holographic effect */}
        {variant === 'holographic' && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl pointer-events-none animate-holographic-shift" />
        )}

        {/* Base gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none rounded-2xl" />

        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none" />

        {/* Dynamic shadow layer */}
        {tiltEnabled && (
          <div 
            className="absolute -inset-4 -z-10 blur-2xl transition-all duration-100"
            style={{
              background: glowColor || 'var(--primary)',
              opacity: isHovered ? 0.2 : 0,
              transform: `translate(${shadowOffset.x}px, ${shadowOffset.y}px)`,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Shimmer effect on hover */}
        {interactive && isHovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-crystal-shimmer pointer-events-none" />
        )}
      </div>
    );
  }
);

Card3D.displayName = "Card3D";

// Sub-components
const Card3DHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  />
));
Card3DHeader.displayName = "Card3DHeader";

const Card3DTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      "text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70",
      "text-3d",
      className
    )}
    {...props}
  />
));
Card3DTitle.displayName = "Card3DTitle";

const Card3DDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/70", className)}
    {...props}
  />
));
Card3DDescription.displayName = "Card3DDescription";

const Card3DContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
Card3DContent.displayName = "Card3DContent";

const Card3DFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6 gap-3", className)}
    {...props}
  />
));
Card3DFooter.displayName = "Card3DFooter";

export {
  Card3D,
  Card3DHeader,
  Card3DTitle,
  Card3DDescription,
  Card3DContent,
  Card3DFooter,
};
