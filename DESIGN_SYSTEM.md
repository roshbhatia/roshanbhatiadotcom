# Design System Documentation

## Overview

This design system is built with React, TypeScript, Tailwind CSS, and shadcn/ui components. It features a comprehensive set of reusable UI components with a focus on accessibility, responsiveness, and developer experience.

## Design Philosophy

- **Minimalism**: Clean, focused design with purposeful elements
- **Consistency**: Unified design language across all components
- **Accessibility**: Built with semantic HTML and proper contrast ratios
- **Performance**: Optimized components with minimal dependencies
- **Responsive**: Mobile-first approach with adaptive layouts

## Technology Stack

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: High-quality, accessible component primitives
- **Radix UI**: Unstyled, accessible component primitives
- **Rose Pine**: Beautiful color scheme with moon/dawn variants
- **Wumpus Mono**: Distinctive monospace typography

## Color Scheme

### Dark Theme (Rose Pine Moon)
- **Background**: `#191724` - Deep purple-black
- **Text**: `#e0def4` - Soft white
- **Border**: `#6e6156` - Muted brown
- **Accent**: `#ebbcba` - Warm pink

### Light Theme (Rose Pine Dawn)
- **Background**: `#fffaf3` - Warm cream
- **Text**: `#575279` - Deep purple
- **Border**: `#908caa` - Muted purple
- **Accent**: `#d7827e` - Warm coral

## Typography

- **Primary Font**: Wumpus Mono (with IBM Plex Mono fallback)
- **Usage**: Monospace throughout for technical authenticity
- **Scale**: Responsive typography with consistent line heights

## Components

### Button
- **Variants**: default, destructive, outline, secondary, ghost, link
- **Sizes**: sm, default, lg, icon
- **Features**: Full keyboard navigation, focus states, loading states

### Card
- **Structure**: Header, title, description, content, footer
- **Features**: Responsive, hover effects, semantic HTML
- **Usage**: Content grouping, forms, dashboards

### Badge
- **Variants**: default, secondary, destructive, outline
- **Features**: Status indicators, tags, notifications
- **Usage**: Status display, categorization, counts

### Switch
- **Features**: Smooth transitions, keyboard navigation
- **Usage**: Toggle settings, preferences, features

### Tabs
- **Features**: Keyboard navigation, smooth transitions
- **Usage**: Content organization, settings, navigation

### Dialog
- **Features**: Modal overlay, focus management, escape to close
- **Usage**: Forms, confirmations, detailed information

### Tooltip
- **Features**: Hover/focus triggers, positioning options
- **Usage**: Contextual help, additional information

### Loading Spinner
- **Sizes**: sm, md, lg
- **Features**: Smooth animation, accessibility
- **Usage**: Loading states, async operations

## Layout System

### Grid
- **Responsive**: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- **Gap**: Consistent spacing using Tailwind gap utilities
- **Usage**: Card layouts, image galleries, dashboards

### Flexbox
- **Features**: Responsive wrapping, equal spacing, alignment
- **Usage**: Navigation, form layouts, component groups

### Spacing
- **Scale**: 4px base unit with consistent multiples
- **Utilities**: Tailwind spacing classes (p-2, p-4, p-6, p-8)
- **Usage**: Component padding, margins, gaps

## Animations

### Built-in Animations
- **fade-in**: Smooth opacity transition
- **slide-up**: Vertical slide with fade
- **hover-lift**: Elevation on hover
- **pulse**: Subtle attention effect
- **bounce**: Playful interaction feedback
- **spin**: Continuous rotation
- **ping**: Notification-style effect

### Usage
```css
animate-fade-in
animate-slide-up
hover-lift
animate-pulse
animate-bounce
animate-spin
animate-ping
```

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md)
- **Desktop**: 1024px - 1280px (lg)
- **Large**: > 1280px (xl)

### Strategy
- Mobile-first approach
- Progressive enhancement
- Touch-friendly targets
- Optimized layouts per breakpoint

## Accessibility

### Features
- **Semantic HTML**: Proper element usage
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and descriptions
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliance
- **Touch Targets**: Minimum 44px tap targets

### Testing
- Automated accessibility testing
- Keyboard navigation testing
- Screen reader testing
- Color contrast validation

## Usage Examples

### Basic Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="md">
  Click me
</Button>
```

### Card with Content
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Theme Usage
```tsx
import { useTheme } from '@/contexts/ThemeContext'

const { theme, toggleTheme } = useTheme()
```

## Customization

### Adding New Colors
```css
:root {
  --new-color: #hex-value;
}

[data-theme="light"] {
  --new-color: #light-hex-value;
}
```

### Custom Components
```tsx
import { cva } from "class-variance-authority"

const customVariants = cva("base-classes", {
  variants: {
    variant: {
      primary: "primary-classes",
      secondary: "secondary-classes",
    },
  },
})
```

## Performance

### Optimization
- **Bundle Size**: Tree-shaking for unused components
- **Runtime**: Efficient re-renders with React.memo
- **Images**: Next.js Image optimization
- **Fonts**: Optimized font loading
- **CSS**: Purged unused styles

### Metrics
- **Bundle Size**: ~290KB (gzipped)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Contributing

1. Follow existing component patterns
2. Use TypeScript for all new components
3. Include accessibility testing
4. Document new components
5. Test responsive behavior
6. Validate performance impact

## Future Enhancements

- [ ] Additional component variants
- [ ] Advanced animation library
- [ ] Component testing suite
- [ ] Storybook integration
- [ ] Design token management
- [ ] Internationalization support