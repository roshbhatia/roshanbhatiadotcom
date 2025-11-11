# Codebase Architecture & Component Analysis

## 1. CURRENT UI COMPONENTS (shadcn-style)

### Core UI Components (All in `/src/components/ui/`)

| Component | Type | Base | Variants | Usage Locations |
|-----------|------|------|----------|-----------------|
| **Button** | shadcn | CVA | 6 variants (default, destructive, outline, secondary, ghost, link) + 4 sizes (sm, default, lg, icon) | Navigation, DesignSystem, DemoPage, multiple cards |
| **Card** | shadcn | React Div | Subcomponents: Header, Title, Description, Content, Footer | DesignSystem (40+ instances), DemoPage (10+ instances), AnimationShowcase |
| **Dialog** | shadcn | @radix-ui/react-dialog | Portal, Trigger, Content, Header, Title, Description, Close | DesignSystem, DemoPage (modal examples) |
| **Tabs** | shadcn | @radix-ui/react-tabs | List, Trigger, Content | DesignSystem (8 tabs), DemoPage (3 tabs) |
| **Switch** | shadcn | @radix-ui/react-switch | Checked/Unchecked states | DesignSystem, DemoPage (form controls) |
| **Badge** | shadcn | CVA | 4 variants (default, secondary, destructive, outline) | DesignSystem (20+ instances), DemoPage (5+ instances) |
| **Tooltip** | shadcn | @radix-ui/react-tooltip | Provider, Trigger, Content | DesignSystem, DemoPage (interactive tooltips) |

### Custom Components (Non-shadcn)

| Component | Purpose | Dependencies | Usage |
|-----------|---------|--------------|-------|
| **Navigation** | Header nav with page routing | Button, useTheme | App.tsx (top nav) |
| **LoadingSpinner** | Loading indicator with 3 sizes | CSS animations | DesignSystem showcase |
| **AnimationShowcase** | Animation demo component | Card, Button | DesignSystem (animations tab) |
| **ImageZoom** | Zoomable images on click | medium-zoom | HomePage (writing content) |
| **WritingSection** | Blog/writing listing | Local state, Shiki | HomePage |
| **GitHubReadme** | Dynamic README fetching | Fetch API | HomePage |

## 2. THEMING IMPLEMENTATION

### Theme System Architecture

**Type**: CSS Variables-based with React Context

**Theme Names** (5 total):
- `dark` - Terminal green on black (cyber aesthetic)
- `light` - Light paper theme
- `gruvbox-light` - Gruvbox light warm theme
- `gruvbox-dark` - Gruvbox dark theme
- `nord-dark` - Nord color palette theme

### CSS Variable Setup

**Location**: `/src/styles/globals.css` (lines 8-91)

**Variables Per Theme**:
```css
--bg          /* Background color */
--text        /* Text color */
--border      /* Border color */
--accent      /* Accent/highlight color */
--link        /* Link color */
--visited     /* Visited link color */
--cell-bg     /* Cell background */
--cell-border /* Cell border */
--code-bg     /* Code block background */
--code-text   /* Code block text */
--code-bg-opposite    /* Opposite theme code bg */
--code-text-opposite  /* Opposite theme code text */
--grid-color  /* Fine grid line color */
--grid-major  /* Major grid line color */
```

### Theme Provider & Context

**File**: `/src/contexts/ThemeContext.tsx`

**Features**:
- LocalStorage persistence
- Cycle through themes with `cycleTheme()`
- Toggle dark/light with `toggleTheme()`
- data-theme attribute on document root
- Themes stored in state: `['dark', 'light', 'gruvbox-light', 'gruvbox-dark', 'nord-dark']`

### Tailwind Integration

**File**: `/tailwind.config.js`

**Custom Colors**:
```js
colors: {
  bg: 'var(--bg)',
  text: 'var(--text)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  link: 'var(--link)',
  visited: 'var(--visited)',
  codeBg: 'var(--code-bg)',
  codeText: 'var(--code-text)',
}
```

## 3. STYLING APPROACH

### Core Styling Stack

1. **Tailwind CSS** (v3.4.0)
   - Utility-first approach
   - Extended with CSS variables
   - Custom fonts configured
   
2. **CSS Variables**
   - 24 custom variables per theme
   - Applied via @layer base
   - Root theme: dark (terminal aesthetic)

3. **Custom CSS Classes** (Web 1.0 aesthetic)
   - `.engineering-grid` - Graph paper background pattern
   - `.technical-border` - Retro borders
   - `.sheet-border` - Layered border effect
   - `.cell-border` - Cell styling with corner markers
   - `.technical-grid` - Grid layout with gap
   - `.corner-markers` - Technical corner decorations
   - `.measurement-indicators` - Ruler-like markers
   - `.content-card`, `.content-text` - Content containers
   - `.schematic-section` - Technical section styling
   - Typography classes: `.text-hero`, `.text-section`, `.text-body`, `.text-small`

4. **Class Composition Tools**
   - `clsx` - Conditional class joining
   - `tailwind-merge` - Merge conflicting Tailwind classes
   - Combined via `cn()` utility function

### Font System

**Primary Font**: JetBrains Mono (monospace)
- Imported from Google Fonts
- Applied to body, headings, code, all text
- Fallbacks: 'Courier New', monospace

### Spacing System (CSS Variables)

```css
--space-xs:  8px
--space-sm: 16px
--space-md: 24px
--space-lg: 40px
--space-xl: 56px
--space-2xl: 80px
--space-3xl: 120px
```

### Responsive Breakpoints

- Mobile: max-width 480px
- Tablet: max-width 768px
- Desktop: default (no limit)

### Animation Status

**Explicitly Disabled** in tailwind.config.js:
```js
keyframes: {},
animation: {},
```

However, CSS `animation` is still used via direct CSS for:
- Spinners (rotate)
- Pulse effects
- Bounce effects
- Ping effects (via animate-ping)

## 4. COMPONENT USAGE MAP

### HomePage.tsx
- Uses: WritingSection, GitHubReadme
- Custom CSS: content-section, content-text, technical-grid, breathing-room
- No UI components directly

### DesignSystem.tsx (Comprehensive Showcase)
```
Total Component Instances: 100+
- Button: 20+ instances (all variants)
- Card: 30+ instances
- Tabs: 1 tabbed interface with 8 tabs
- Switch: 5+ instances
- Badge: 15+ instances
- Dialog: 2 instances
- Tooltip: 5+ instances
- LoadingSpinner: 3 instances
```

### DemoPage.tsx (Interactive Dashboard)
```
Total Component Instances: 50+
- Card: 15+ instances
- Button: 20+ instances
- Tabs: 1 tabbed interface
- Badge: 5+ instances
- Tooltip: 10+ instances (with TooltipProvider)
- Switch: 2+ instances
```

### Navigation.tsx
- Button: 4 instances (nav items)
- Custom styling only

### App.tsx (Root Component)
- Themes application
- Footer with theme toggle
- Main content wrapper with technical styling
- Page routing logic

## 5. DEPENDENCY ANALYSIS

### Radix UI Primitives
- `@radix-ui/react-dialog` (^1.1.15)
- `@radix-ui/react-switch` (^1.2.6)
- `@radix-ui/react-tabs` (^1.1.13)
- `@radix-ui/react-tooltip` (^1.2.8)
- `@radix-ui/react-slot` (^1.2.4)

### Component Libraries
- `class-variance-authority` (^0.7.1) - Variant generation for Button, Badge
- `clsx` (^2.1.1) - Class name utility
- `lucide-react` (^0.553.0) - Icon library (used in Dialog close button)

### Code & Content
- `react-syntax-highlighter` (^16.1.0) - Code highlighting
- `shiki` (^3.15.0) - Modern syntax highlighting
- `medium-zoom` (^1.1.0) - Image zoom functionality

### Utilities
- `tailwind-merge` (^3.3.1) - Merge Tailwind conflicts

## 6. CANDIDATES FOR REPLACEMENT

### High Priority (Direct Impact)
1. **Button Component**
   - Current: Complex CVA-based with 6 variants
   - Pain: Heavy customization for Web 1.0 aesthetic might be overkill
   - Replacement: Custom styled button or simpler component

2. **Dialog Component**
   - Current: Uses Radix with animations
   - Pain: Animations conflict with Web 1.0 aesthetic
   - Replacement: Simple modal without animations or custom implementation

3. **Tooltip Component**
   - Current: Radix-based with complex positioning
   - Pain: May not align with retro aesthetic
   - Replacement: Static tooltip or hover-based alternative

### Medium Priority
4. **Tabs Component**
   - Current: Radix-based with full accessibility
   - Replacement: Custom tab implementation or HTML-based solution

5. **Card Component**
   - Current: Multiple subcomponents (Header, Title, Description, Content, Footer)
   - Pain: Heavy usage (40+ instances in one page)
   - Replacement: Simplified div-based card with CSS classes

6. **Switch Component**
   - Current: Radix switch primitive
   - Replacement: HTML checkbox input with CSS styling

### Low Priority (Utility/Helper)
7. **Badge Component**
   - Current: CVA-based inline component
   - Replacement: Simple styled span or div

## 7. STYLING OPPORTUNITIES

### Strengths
- Well-organized CSS variable system
- Good theme coverage (5 themes)
- Monospace-first typography creates cohesive aesthetic
- Mobile-first responsive design

### Areas for Simplification
- 100+ custom CSS classes - could be consolidated
- Multiple component abstraction layers - some redundancy
- Radix UI dependencies - could be removed for simpler components
- Animation inconsistency - CSS animations work despite tailwind config disabling

### Web 1.0 Aesthetic Alignment
- Current: Well-aligned with retro aesthetic
- CSS variables work well with 5 color schemes
- Technical borders, grid patterns, corner markers all fit theme
- Main issue: Radix components sometimes conflict with pure CSS aesthetic

## 8. COMPONENT DEPENDENCY TREE

```
App.tsx (Root)
├── ThemeProvider
│   ├── HomePage
│   │   ├── WritingSection
│   │   │   └── Shiki (syntax highlighting)
│   │   └── GitHubReadme
│   │       └── Fetch API
│   └── Footer
│       └── Button (theme toggle)
└── Navigation
    └── Button x4

DesignSystem.tsx
├── Button x20+
├── Card x30+ (with subcomponents)
├── Dialog x2
├── Tabs x1 (with 8 tabs)
├── Switch x5+
├── Badge x15+
├── Tooltip x5+ (with Provider)
└── LoadingSpinner x3
└── AnimationShowcase
    ├── Card x4
    └── Button x4

DemoPage.tsx
├── Card x15+
├── Button x20+
├── Badge x5+
├── Tabs x1
├── Switch x2+
├── Tooltip x10+ (with Provider)
└── Dialog x2 (implied by code)
```

## 9. FILE STRUCTURE

```
/src/
├── components/
│   ├── ui/
│   │   ├── button.tsx (139 lines, CVA-based)
│   │   ├── card.tsx (79 lines, compound component)
│   │   ├── dialog.tsx (120 lines, Radix-based)
│   │   ├── tabs.tsx (53 lines, Radix-based)
│   │   ├── switch.tsx (27 lines, Radix-based)
│   │   ├── badge.tsx (36 lines, CVA-based)
│   │   └── tooltip.tsx (28 lines, Radix-based)
│   ├── Navigation.tsx (45 lines)
│   ├── LoadingSpinner.tsx (42 lines)
│   ├── AnimationShowcase.tsx (69 lines)
│   ├── ImageZoom.tsx (46 lines)
│   └── [WritingSection.tsx] (large, in root)
├── contexts/
│   └── ThemeContext.tsx (57 lines)
├── pages/
│   ├── HomePage.tsx (129 lines)
│   ├── DesignSystem.tsx (656 lines)
│   └── DemoPage.tsx (415 lines)
├── styles/
│   └── globals.css (842 lines)
├── lib/
│   └── utils.ts (6 lines - just cn() function)
└── App.tsx (63 lines)
```

## 10. KEY INSIGHTS

### Technical Debt
1. Large globals.css (842 lines) - could be split
2. Multiple UI component abstractions - could consolidate
3. Radix UI dependency for simple interactions
4. Unused animations in Tailwind config but CSS animations in use
5. 50+ instances of Card component in single page - consider template

### Architecture Strengths
1. Clean separation: UI components → pages → App
2. Theme system is well-encapsulated
3. Custom CSS aesthetic layer is consistent
4. Good use of compound components (Card subcomponents)
5. TypeScript throughout

### Recommendation Summary
- **Keep**: Theme system, CSS variable approach, monospace aesthetic
- **Simplify**: Dialog, Tooltip, Switch, Tabs
- **Consolidate**: Button, Badge (simpler styling)
- **Consider removing**: Some Radix dependencies if Web 1.0 aesthetic prioritized
- **Refactor**: Split globals.css, extract theme colors to separate file
