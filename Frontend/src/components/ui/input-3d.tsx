import * as React from "react";
import { cn } from "./utils";
import { Eye, EyeOff, X } from "lucide-react";

export interface Input3DProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'glass' | 'neon' | '3d' | 'floating' | 'minimal';
  glassEffect?: 'light' | 'medium' | 'strong';
  glowColor?: 'blue' | 'purple' | 'cyan' | 'green' | 'orange';
  depth?: 1 | 2 | 3;
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

const Input3D = React.forwardRef<HTMLInputElement, Input3DProps>(
  ({ 
    className, 
    type,
    variant = 'glass',
    glassEffect = 'medium',
    glowColor = 'blue',
    depth = 2,
    label,
    error,
    success,
    leftIcon,
    rightIcon,
    clearable,
    onClear,
    value,
    disabled,
    onChange,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState('');
    const internalRef = React.useRef<HTMLInputElement>(null);

    const isPasswordType = type === 'password';
    const inputType = isPasswordType && showPassword ? 'text' : type;

    // Support both controlled and uncontrolled modes
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const hasValue = !!currentValue;

    // Track actual input value for uncontrolled usage
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
    }, [isControlled, onChange]);

    // Handle clear action
    const handleClear = React.useCallback(() => {
      if (!isControlled) {
        setInternalValue('');
      }
      if (onClear) {
        onClear();
      }
      // Create synthetic event to notify parent
      if (onChange && internalRef.current) {
        const syntheticEvent = {
          target: { ...internalRef.current, value: '' },
          currentTarget: internalRef.current,
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }, [isControlled, onClear, onChange]);

    // Merge forwarded ref with internal ref
    const mergedRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const variantClasses = {
      glass: cn(
        'bg-white/5 backdrop-blur-xl border border-white/20',
        'hover:bg-white/10 focus:bg-white/10',
        'focus:border-white/30 focus:ring-2 focus:ring-primary/50'
      ),
      neon: cn(
        'bg-primary/10 backdrop-blur-lg border-2 border-primary',
        'shadow-[0_0_20px_var(--primary-glow)]',
        'focus:shadow-[0_0_30px_var(--primary-glow),0_0_60px_var(--primary-glow)]',
        'animate-glow-pulse'
      ),
      '3d': cn(
        'bg-white/8 backdrop-blur-lg border border-white/20',
        'shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.1)]',
        'hover:shadow-[0_6px_16px_rgba(0,0,0,0.25),inset_0_3px_6px_rgba(255,255,255,0.15)]',
        'focus:shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]',
        'focus:-translate-y-0.5 transition-all duration-200'
      ),
      floating: cn(
        'bg-transparent border-b-2 border-white/20',
        'focus:border-primary focus:ring-0',
        'px-0 rounded-none'
      ),
      minimal: cn(
        'bg-white/3 backdrop-blur-md border border-white/10',
        'hover:bg-white/5 focus:bg-white/8',
        'focus:border-white/20'
      ),
    };

    const glassEffectClasses = {
      light: 'backdrop-blur-lg',
      medium: 'backdrop-blur-xl',
      strong: 'backdrop-blur-2xl',
    };

    const glowColorClasses = {
      blue: 'focus:ring-blue-500/50 focus:border-blue-500',
      purple: 'focus:ring-purple-500/50 focus:border-purple-500',
      cyan: 'focus:ring-cyan-500/50 focus:border-cyan-500',
      green: 'focus:ring-green-500/50 focus:border-green-500',
      orange: 'focus:ring-orange-500/50 focus:border-orange-500',
    };

    const depthClasses = {
      1: 'shadow-[0_2px_4px_rgba(0,0,0,0.1)]',
      2: 'shadow-[0_4px_8px_rgba(0,0,0,0.15)]',
      3: 'shadow-[0_8px_16px_rgba(0,0,0,0.2)]',
    };

    // Only reserve padding if content is actually rendered
    const hasLeftContent = !!leftIcon;
    const hasRightContent = !!rightIcon || (clearable && !!currentValue) || isPasswordType;

    return (
      <div className="relative w-full">
        {/* Floating label */}
        {variant === 'floating' && label && (
          <label
            className={cn(
              "absolute left-0 transition-all duration-200 pointer-events-none",
              "text-white/70",
              isFocused || hasValue
                ? "text-xs -top-5 text-primary"
                : "text-base top-3"
            )}
          >
            {label}
          </label>
        )}

        {/* Regular label */}
        {variant !== 'floating' && label && (
          <label className="block text-sm font-medium text-white/80 mb-2 px-1">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={mergedRef}
            type={inputType}
            value={currentValue}
            disabled={disabled}
            onChange={handleChange}
            className={cn(
              "flex h-11 w-full rounded-lg px-4 py-2 text-base",
              "text-white placeholder:text-white/40",
              "transition-all duration-300 outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              variantClasses[variant],
              glassEffectClasses[glassEffect],
              !error && !success && glowColorClasses[glowColor],
              depthClasses[depth],
              hasLeftContent && "pl-10",
              hasRightContent && "pr-10",
              error && "border-red-500 focus:ring-red-500/50",
              success && "border-green-500 focus:ring-green-500/50",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Right content */}
          {hasRightContent && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Clear button */}
              {clearable && currentValue && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-white/50 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Password toggle */}
              {isPasswordType && !disabled && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/50 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Custom right icon */}
              {rightIcon && !isPasswordType && !clearable && (
                <div className="text-white/50">
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-2 text-sm text-red-400 animate-subtle-pulse px-1">
            {error}
          </p>
        )}

        {/* Success message */}
        {success && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-glow-pulse" />
          </div>
        )}
      </div>
    );
  }
);

Input3D.displayName = "Input3D";

export { Input3D };
