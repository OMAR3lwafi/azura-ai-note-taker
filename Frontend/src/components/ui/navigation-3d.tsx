import * as React from "react";
import { cn } from "./utils";
import { ChevronDown } from "lucide-react";

export interface Navigation3DBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pill' | 'rounded' | 'square' | 'floating' | 'attached';
  position?: 'top' | 'bottom' | 'center' | 'inline';
}

const Navigation3DBar = React.forwardRef<HTMLDivElement, Navigation3DBarProps>(
  ({ className, variant = 'pill', position = 'inline', children, ...props }, ref) => {
    const variantClasses = {
      pill: 'rounded-full',
      rounded: 'rounded-2xl',
      square: 'rounded-lg',
      floating: 'rounded-full shadow-[0_16px_48px_rgba(0,0,0,0.4)]',
      attached: 'rounded-t-2xl',
    };

    const positionClasses = {
      top: 'fixed top-4 left-1/2 -translate-x-1/2 z-50',
      bottom: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
      center: 'mx-auto',
      inline: 'relative',
    };

    return (
      <nav
        ref={ref}
        className={cn(
          'flex items-center gap-2 p-2',
          'bg-black/20 backdrop-blur-xl border border-white/10',
          'shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'transition-all duration-300',
          variantClasses[variant],
          positionClasses[position],
          className
        )}
        {...props}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 rounded-inherit pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-2 w-full">
          {children}
        </div>
      </nav>
    );
  }
);
Navigation3DBar.displayName = "Navigation3DBar";

export interface Navigation3DTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  badge?: number;
}

const Navigation3DTab = React.forwardRef<HTMLButtonElement, Navigation3DTabProps>(
  ({ className, active, icon, badge, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'relative flex items-center justify-center gap-2',
          'px-4 py-2 rounded-full',
          'text-sm font-medium',
          'transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          active
            ? cn(
                'bg-primary text-white',
                'shadow-[0_4px_16px_var(--primary-glow),inset_0_1px_0_rgba(255,255,255,0.2)]',
                'scale-105'
              )
            : cn(
                'text-white/70 hover:text-white',
                'hover:bg-white/10',
                'hover:scale-105'
              ),
          className
        )}
        {...props}
      >
        {/* Active background shimmer */}
        {active && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-crystal-shimmer rounded-full" />
          </>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {icon && <span className="text-current">{icon}</span>}
          {children}
        </span>

        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 z-20",
            "flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1",
            "text-[10px] font-bold text-white",
            "bg-gradient-to-br from-red-500 to-red-600",
            "rounded-full",
            "border border-white/20",
            "shadow-lg animate-subtle-pulse"
          )}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* Active indicator glow */}
        {active && (
          <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-glow-pulse" />
        )}
      </button>
    );
  }
);
Navigation3DTab.displayName = "Navigation3DTab";

export interface Navigation3DIndicatorProps {
  activeIndex: number;
  itemCount: number;
}

const Navigation3DIndicator = ({ activeIndex, itemCount }: Navigation3DIndicatorProps) => {
  const widthPercent = 100 / itemCount;
  const leftPercent = (100 / itemCount) * activeIndex;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className={cn(
          "absolute h-full",
          "bg-gradient-to-r from-primary/20 to-primary/10",
          "backdrop-blur-sm rounded-full",
          "transition-all duration-300 ease-out",
          "shadow-[0_0_20px_var(--primary-glow)]"
        )}
        style={{
          width: `${widthPercent}%`,
          left: `${leftPercent}%`,
        }}
      />
    </div>
  );
};
Navigation3DIndicator.displayName = "Navigation3DIndicator";

export interface Navigation3DMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Navigation3DMenu = React.forwardRef<HTMLDivElement, Navigation3DMenuProps>(
  ({ className, trigger, open, onOpenChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open || false);

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    return (
      <div ref={ref} className="relative" {...props}>
        {/* Trigger */}
        <button
          onClick={handleToggle}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            'text-sm font-medium text-white/70 hover:text-white',
            'hover:bg-white/10 transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            isOpen && 'bg-white/10 text-white'
          )}
        >
          {trigger}
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-300",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Menu content */}
        {isOpen && (
          <div
            className={cn(
              'absolute top-full mt-2 min-w-[200px]',
              'bg-black/40 backdrop-blur-2xl',
              'border border-white/20 rounded-xl',
              'shadow-[0_16px_48px_rgba(0,0,0,0.5)]',
              'p-2',
              'animate-in fade-in-0 slide-in-from-top-2 duration-200',
              className
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
Navigation3DMenu.displayName = "Navigation3DMenu";

const Navigation3DMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
      'text-sm text-white/70 hover:text-white',
      'hover:bg-white/10 transition-all duration-200',
      'focus:outline-none focus:bg-white/15',
      'text-left',
      className
    )}
    {...props}
  >
    {children}
  </button>
));
Navigation3DMenuItem.displayName = "Navigation3DMenuItem";

const Navigation3DMenuDivider = () => (
  <div className="h-px bg-white/10 my-2" />
);

export {
  Navigation3DBar,
  Navigation3DTab,
  Navigation3DIndicator,
  Navigation3DMenu,
  Navigation3DMenuItem,
  Navigation3DMenuDivider,
};
