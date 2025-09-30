# Azora AI NoteTaker - 3D Glass Design System

## Overview

The Azora AI NoteTaker features a cutting-edge **3D Glass Design System** that combines modern glass morphism effects with advanced 3D depth, neon glow, and interactive animations. Inspired by Apple's Vision Pro interface, Linear, and Notion, this design system delivers a premium, futuristic user experience.

### Design Philosophy

- **Depth & Dimension**: Multi-layered shadows and 3D transforms create true depth perception
- **Glass Realism**: Advanced backdrop filters with blur, saturation, and brightness for realistic glass
- **Neon Accents**: Glowing elements that pulse and respond to user interaction
- **Smooth Motion**: GPU-accelerated animations with 60fps performance
- **Accessibility First**: Full RTL support, reduced motion, and WCAG AAA compliance

---

## Design Tokens

### Color Palette

#### Primary Colors
- `--primary`: #1e3a8a (Crystal Blue)
- `--primary-foreground`: #ffffff
- `--primary-glow`: rgba(30, 58, 138, 0.4)
- `--primary-crystal`: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)

#### Silver Gradients (Typography)
- `--silver-light`: #f8f9fa
- `--silver-medium`: #c4c7d0
- `--silver-dark`: #8b8d98
- `--silver-gradient`: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #c4c7d0 100%)

#### Neon Glow Colors
- `--glow-neon-blue`: rgba(59, 130, 246, 0.5)
- `--glow-neon-purple`: rgba(168, 85, 247, 0.5)
- `--glow-neon-cyan`: rgba(6, 182, 212, 0.5)
- `--glow-neon-green`: rgba(34, 197, 94, 0.5)
- `--glow-neon-orange`: rgba(249, 115, 22, 0.5)

#### Glass & Depth
- `--glass-background`: rgba(255, 255, 255, 0.05)
- `--glass-border`: rgba(255, 255, 255, 0.1)
- `--glass-depth-light`: rgba(255, 255, 255, 0.08)
- `--glass-depth-medium`: rgba(255, 255, 255, 0.12)
- `--glass-depth-strong`: rgba(255, 255, 255, 0.18)

### Depth Layers

Multi-level shadow system for 3D depth:

- **Depth 1**: `0 2px 4px rgba(0, 0, 0, 0.1)` - Subtle elevation
- **Depth 2**: `0 4px 8px rgba(0, 0, 0, 0.15)` - Light floating
- **Depth 3**: `0 8px 16px rgba(0, 0, 0, 0.2)` - Medium elevation
- **Depth 4**: `0 16px 32px rgba(0, 0, 0, 0.25)` - High elevation
- **Depth 5**: `0 24px 48px rgba(0, 0, 0, 0.3)` - Maximum depth

### Typography

#### Font Weights
- Thin: 100
- Light: 300
- Normal: 400
- Medium: 500
- Semibold: 600

#### Scale
- `text-sm`: 14px
- `text-base`: 16px
- `text-lg`: 18px
- `text-xl`: 20px
- `text-2xl`: 24px
- `text-3xl`: 30px
- `text-4xl`: 36px

---

## Components

### Button Variants

#### glass3d
**When to use**: Standard interactive buttons with premium feel

```tsx
<Button variant="glass3d" size="lg">
  Click Me
</Button>
```

**Styling**: Frosted glass background with 3D shadow, lifts on hover
**Animation**: Smooth transform and shadow transition (300ms)

#### neon
**When to use**: Call-to-action buttons, important actions

```tsx
<Button variant="neon">
  Start Recording
</Button>
```

**Styling**: Neon border glow with pulsing animation
**Animation**: Continuous glow-pulse effect

#### gradient3d
**When to use**: Primary actions, hero CTAs

```tsx
<Button variant="gradient3d" size="2xl">
  Get Started
</Button>
```

**Styling**: Multi-color gradient (blue → purple → pink)
**Animation**: Scale up + shadow increase on hover

#### magnetic
**When to use**: Interactive elements that need attention

```tsx
<Button variant="magnetic">
  Explore
</Button>
```

**Styling**: Glass with strong depth
**Animation**: Lifts toward cursor on hover (translateY + scale)

#### holographic
**When to use**: Special features, premium actions

```tsx
<Button variant="holographic">
  AI Insights
</Button>
```

**Styling**: Iridescent gradient with color shift
**Animation**: Background position + hue rotation

#### floating
**When to use**: Persistent UI elements (FABs)

```tsx
<Button variant="floating" className="fixed bottom-6 right-6">
  <Plus className="h-6 w-6" />
</Button>
```

**Styling**: Light glass with subtle elevation
**Animation**: Constant floating animation (4s ease-in-out)

#### frosted
**When to use**: Subtle interactions, secondary actions

```tsx
<Button variant="frosted">
  Cancel
</Button>
```

**Styling**: Heavy backdrop blur with minimal background
**Animation**: Background opacity change on hover

#### crystal
**When to use**: Premium selections, highlighted options

```tsx
<Button variant="crystal">
  Upgrade to Pro
</Button>
```

**Styling**: Dual-tone gradient glass with sharp reflections
**Animation**: Shadow glow increase on hover

---

### Card Variants

#### Glass Card (GlassCard)
**When to use**: Standard content containers

```tsx
<GlassCard variant="3d-medium" depth={3} glow="blue">
  <GlassCardHeader>
    <GlassCardTitle>Title</GlassCardTitle>
    <GlassCardDescription>Description</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>
    Content here
  </GlassCardContent>
</GlassCard>
```

**Props**:
- `variant`: 'default' | '3d-light' | '3d-medium' | '3d-strong' | 'neon' | 'frosted' | 'holographic' | 'floating' | 'magnetic'
- `depth`: 1 | 2 | 3 | 4 | 5 (shadow intensity)
- `glow`: 'none' | 'blue' | 'purple' | 'cyan' | 'multi'
- `animate`: 'none' | 'float' | 'pulse' | 'shimmer' | 'glow'
- `tiltOnHover`: boolean (enables 3D tilt effect)
- `animateGradient`: boolean (animates gradient overlay)

#### 3D Interactive Card (Card3D)
**When to use**: Interactive content with mouse tracking

```tsx
<Card3D
  variant="glass"
  tiltEnabled
  tiltIntensity={0.3}
  glowColor="rgba(59, 130, 246, 0.4)"
  interactive
>
  <Card3DHeader>
    <Card3DTitle>Interactive Card</Card3DTitle>
  </Card3DHeader>
  <Card3DContent>
    Follows mouse with 3D tilt
  </Card3DContent>
</Card3D>
```

**Features**:
- Mouse tracking with perspective transform
- Dynamic lighting highlight following cursor
- Smooth 3D rotation (±15° max)
- Responsive shadow based on tilt angle

---

### Input Components

#### Input3D
**When to use**: Form inputs with modern styling

```tsx
<Input3D
  variant="glass"
  glassEffect="medium"
  glowColor="blue"
  label="Email"
  leftIcon={<Mail className="h-4 w-4" />}
  clearable
  onClear={() => setValue('')}
/>
```

**Variants**:
- `glass`: Frosted glass with backdrop blur
- `neon`: Neon border with pulsing glow
- `3d`: Deep 3D effect with inset shadows
- `floating`: Floating label animation
- `minimal`: Subtle glass with minimal effects

**Props**:
- `variant`: Input style variant
- `glassEffect`: 'light' | 'medium' | 'strong' (blur intensity)
- `glowColor`: 'blue' | 'purple' | 'cyan' | 'green' | 'orange'
- `depth`: 1 | 2 | 3 (shadow depth)
- `label`: string (label text)
- `error`: string (error message)
- `success`: boolean (success state)
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `clearable`: boolean (show clear button)

---

### Modal Components

#### Modal3D
**When to use**: Dialogs, confirmations, forms

```tsx
<Modal3D>
  <Modal3DTrigger asChild>
    <Button variant="glass3d">Open Modal</Button>
  </Modal3DTrigger>
  <Modal3DContent variant="glass" size="md">
    <Modal3DHeader>
      <Modal3DTitle>Modal Title</Modal3DTitle>
      <Modal3DDescription>Description text</Modal3DDescription>
    </Modal3DHeader>
    <Modal3DBody>
      Content with scroll
    </Modal3DBody>
    <Modal3DFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="gradient3d">Confirm</Button>
    </Modal3DFooter>
  </Modal3DContent>
</Modal3D>
```

**Variants**:
- `glass`: Standard frosted glass modal
- `neon`: Modal with neon glow border
- `floating`: Floating modal with animation
- `centered`: Centered with ambient glow
- `fullscreen`: Full-screen overlay

**Sizes**: 'sm' | 'md' | 'lg' | 'xl' | 'full'

**Animations**:
- Entry: Scale from 0.95 + fade in + slide up
- Exit: Scale to 0.95 + fade out + slide down
- Duration: 300ms with ease-out

---

### Navigation Components

#### Navigation3D
**When to use**: Tab bars, bottom navigation

```tsx
<Navigation3DBar variant="pill" position="bottom">
  <Navigation3DTab active icon={<Home />}>
    Home
  </Navigation3DTab>
  <Navigation3DTab icon={<Mic />} badge={3}>
    Sessions
  </Navigation3DTab>
  <Navigation3DTab icon={<Settings />}>
    Settings
  </Navigation3DTab>
</Navigation3DBar>
```

**Variants**:
- `pill`: Rounded pill shape
- `rounded`: Rounded corners (2xl)
- `square`: Square corners (lg)
- `floating`: Floating with shadow
- `attached`: Attached to edge

**Positions**: 'top' | 'bottom' | 'center' | 'inline'

---

## Glass Effects

### Utility Classes

#### .glass-surface
Base glass effect with multi-layer shadows and highlight

```css
.glass-surface {
  background: var(--glass-background);
  backdrop-filter: blur(24px) saturate(200%) brightness(1.1);
  border: 1px solid var(--glass-border);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

#### .glass-3d-light
Subtle 3D glass with 2-3px elevation

#### .glass-3d-medium
Medium 3D depth with 8-12px elevation

#### .glass-3d-strong
Deep 3D effect with 16-24px elevation

#### .glass-frosted
Heavy blur with frost texture

#### .glass-reflective
Mirror-like surface with dynamic reflections

#### .glass-neon
Glass with neon edge glow

---

## Animations

### Keyframe Animations

#### @keyframes floating
Smooth vertical floating motion
```css
0%, 100% { transform: translateY(0px); }
50% { transform: translateY(-6px); }
```
**Duration**: 4s ease-in-out infinite

#### @keyframes depth-float
3D floating with Z-axis movement
```css
0%, 100% { transform: translateY(0) translateZ(0); }
50% { transform: translateY(-10px) translateZ(10px); }
```

#### @keyframes neon-pulse
Pulsing neon glow effect
```css
0%, 100% { 
  box-shadow: 0 0 20px var(--primary-glow), 0 0 40px var(--primary-glow);
}
50% { 
  box-shadow: 0 0 30px var(--primary-glow), 0 0 60px var(--primary-glow);
}
```
**Duration**: 2s ease-in-out infinite

#### @keyframes holographic-shift
Iridescent color shifting
```css
0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
50% { background-position: 100% 50%; filter: hue-rotate(45deg); }
100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
```
**Duration**: 5s ease infinite

#### @keyframes glass-shimmer-3d
3D light reflection movement
```css
0% { background-position: -200% 0; transform: translateZ(0); }
50% { transform: translateZ(5px); }
100% { background-position: 200% 0; transform: translateZ(0); }
```

---

## Micro-interactions

### Hover Effects

#### .hover-lift
Lifts element on hover with shadow increase

```css
.hover-lift {
  transition: all 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--depth-4);
}
```

#### .hover-glow-neon
Adds neon glow on hover

#### .hover-depth
Increases 3D depth on hover

### Active States

#### .active-press
Press-down effect on active

```css
.active-press:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: var(--depth-1);
}
```

### Focus States

#### .focus-ring-3d
3D focus ring with depth

```css
.focus-ring-3d:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 3px var(--ring),
    0 8px 16px rgba(0, 0, 0, 0.2);
}
```

---

## Performance Optimization

### GPU Acceleration
All animations use `transform` and `opacity` for 60fps performance:
- `will-change: transform` on animated elements
- `transform: translateZ(0)` to trigger GPU
- Avoid animating `width`, `height`, or `left/right`

### Reduced Motion
Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility

### Color Contrast
All text meets WCAG AAA standards:
- Normal text: 7:1 contrast ratio minimum
- Large text: 4.5:1 contrast ratio minimum

### Focus Indicators
All interactive elements have visible focus states:
- Minimum 3px focus ring
- Color contrast 3:1 against background

### Screen Reader Support
- Proper ARIA labels on all components
- Semantic HTML structure
- Keyboard navigation support

### RTL Support
Full bidirectional text support:
- Automatic icon mirroring
- Reversed flex directions
- Adjusted animation directions

---

## Best Practices

### When to Use Glass Effects
✅ **Use glass for**:
- Overlay UI (modals, dropdowns, tooltips)
- Cards with background content visible
- Navigation bars and controls
- Floating action buttons

❌ **Avoid glass for**:
- Large text-heavy content areas
- High-contrast required elements
- Performance-critical animations on low-end devices

### Component Composition
```tsx
// ✅ Good: Proper layering and depth
<Card3D variant="glass" depth={3} tiltEnabled>
  <div className="relative z-10">
    <Button variant="gradient3d">Action</Button>
  </div>
</Card3D>

// ❌ Bad: Missing z-index management
<Card3D variant="glass">
  <Button variant="gradient3d">Action</Button>
</Card3D>
```

### Animation Performance
```tsx
// ✅ Good: GPU-accelerated
<div className="animate-floating" style={{ willChange: 'transform' }}>

// ❌ Bad: CPU-bound animation
<div className="animate-width-change">
```

---

## Migration from Luxury Theme

The new 3D Glass system maintains backward compatibility while offering enhanced variants:

### Button Migration
```tsx
// Old
<Button variant="default">Click</Button>

// New - Enhanced
<Button variant="glass3d">Click</Button>
<Button variant="gradient3d">CTA</Button>
```

### Card Migration
```tsx
// Old
<GlassCard variant="elevated">Content</GlassCard>

// New - More options
<Card3D variant="glass" tiltEnabled interactive>
  Content
</Card3D>
```

### Breaking Changes
None - all existing components continue to work. New variants are additive.

---

## Examples & Code Snippets

### Complete Screen Example
```tsx
function ModernHomeScreen() {
  return (
    <div className="p-4 space-y-6">
      {/* Hero Card */}
      <Card3D
        variant="holographic"
        tiltEnabled
        animated
      >
        <h1 className="text-4xl font-bold text-holographic">
          Welcome
        </h1>
        <Button variant="gradient3d" size="2xl">
          Get Started
        </Button>
      </Card3D>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Card3D
            key={action.id}
            variant="glass"
            interactive
            glowColor={action.glowColor}
          >
            <Icon className="h-8 w-8" />
            <h3>{action.title}</h3>
          </Card3D>
        ))}
      </div>
    </div>
  );
}
```

---

## Version History

### v1.0.0 (Current)
- Initial 3D glass design system
- 8 button variants with advanced animations
- 10+ glass effect utilities
- Full RTL/accessibility support
- Performance optimized for 60fps

---

## Support & Resources

- **Component Library**: `/src/components/ui`
- **Style Guide**: `/src/styles/globals.css`
- **Examples**: `/src/components/modern`
- **Icons**: Lucide React (https://lucide.dev)

For questions or contributions, refer to the project README.
