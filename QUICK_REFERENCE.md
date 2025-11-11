# Quick Reference: Codebase Component Analysis

## Executive Summary

Your codebase uses a **shadcn/ui-style architecture** with **Radix UI primitives** and **custom Web 1.0 aesthetic CSS** via **CSS Variables and Tailwind**.

### By The Numbers
- **7 UI Components** (all shadcn-style in `/src/components/ui/`)
- **6 Custom Components** (Navigation, LoadingSpinner, etc.)
- **5 Color Themes** available (dark, light, gruvbox-light, gruvbox-dark, nord-dark)
- **24 CSS Variables** per theme
- **100+ Custom CSS Classes** for retro aesthetic
- **100+ Component Instances** across showcase pages
- **842 lines** in main CSS file (globals.css)

## Current Architecture

```
STYLING: Tailwind CSS + CSS Variables + Custom Classes
COMPONENTS: Radix UI Primitives wrapped with React.forwardRef + CVA
THEMING: React Context + LocalStorage + CSS Variables
FONTS: JetBrains Mono (monospace throughout)
AESTHETIC: Web 1.0 (technical, retro, terminal-like)
```

## Exact Component Inventory

### UI Components (in `/src/components/ui/`)

| Name | Type | Base | Dependencies | Instances Used |
|------|------|------|--------------|-----------------|
| button | shadcn | CVA | clsx, tailwind-merge, @radix-ui/react-slot | 50+ |
| card | shadcn | React.forwardRef | clsx | 50+ |
| dialog | shadcn | Radix | @radix-ui/react-dialog, lucide-react | 4+ |
| tabs | shadcn | Radix | @radix-ui/react-tabs | 2 |
| switch | shadcn | Radix | @radix-ui/react-switch | 7+ |
| badge | shadcn | CVA | clsx, tailwind-merge | 20+ |
| tooltip | shadcn | Radix | @radix-ui/react-tooltip | 15+ |

### Custom Components

| Name | Purpose | File Location | Instances |
|------|---------|----------------|-----------|
| Navigation | Page navigation header | `/src/components/Navigation.tsx` | 1 (in App) |
| LoadingSpinner | Loading indicator | `/src/components/LoadingSpinner.tsx` | 3 |
| AnimationShowcase | Animation demo | `/src/components/AnimationShowcase.tsx` | 1 |
| ImageZoom | Zoomable images | `/src/components/ImageZoom.tsx` | Variable |
| WritingSection | Blog content | `/src/WritingSection.tsx` | 1 (in HomePage) |
| GitHubReadme | GitHub README fetch | Inside HomePage.tsx | 1 (in HomePage) |

## Theming System Details

### How It Works
1. **CSS Variables** defined in `/src/styles/globals.css` (lines 8-91)
2. **React Context** in `/src/contexts/ThemeContext.tsx` manages state
3. **data-theme attribute** on `<html>` element switches styles
4. **LocalStorage** persists user selection
5. **Tailwind config** extends colors with CSS variables

### Available Themes
```
1. dark          - Terminal green on black (#00ff00 on #000000)
2. light         - Clean paper theme
3. gruvbox-light - Warm retro light theme
4. gruvbox-dark  - Dark gruvbox theme
5. nord-dark     - Nord color palette
```

### CSS Variables (used in all 5 themes)
```
--bg                  (background)
--text                (text color)
--border              (borders)
--accent              (highlight/button color)
--link                (link color)
--visited             (visited link)
--cell-bg             (container background)
--cell-border         (container border)
--code-bg             (code block background)
--code-text           (code block text)
--code-bg-opposite    (opposite theme code bg)
--code-text-opposite  (opposite theme code text)
--grid-color          (fine grid lines)
--grid-major          (major grid lines)

--space-xs   to --space-3xl (spacing system)
```

## Styling Approach

### What You're Using
1. **Tailwind CSS** (v3.4.0)
   - Utilities for layout, spacing, sizing
   - Extended with CSS variables for colors
   - Animations DISABLED in config (but some CSS animations used anyway)

2. **CSS Variables**
   - Dynamic theming without JS computation
   - Single source of truth per theme
   - Works with Tailwind via custom colors

3. **Custom CSS Classes** (100+)
   - `.engineering-grid` - Graph paper background
   - `.technical-border` - Retro-style borders
   - `.sheet-border` - Layered 3D border effect
   - `.corner-markers` - Technical corner decorations
   - `.measurement-indicators` - Ruler-like visual elements
   - Typography scales: `.text-hero`, `.text-section`, `.text-body`, `.text-small`

4. **Class Composition**
   - `cn()` utility function combines clsx + tailwind-merge
   - Prevents conflicting Tailwind classes

### Fonts
- Primary: **JetBrains Mono** (imported from Google Fonts)
- Fallback: 'Courier New', monospace
- Applied everywhere (body, headings, code, buttons)

## Component Usage by Page

### HomePage
- **No UI components** - uses only custom components
- **WritingSection** - displays blog content with Shiki syntax highlighting
- **GitHubReadme** - fetches and displays GitHub README
- **Custom CSS only** - content-section, content-text, technical-grid

### DesignSystem (showcase page)
- **Heavy component usage** - 100+ instances
- **All 7 UI components** demonstrated
- **Variants shown** - all button/badge/dialog variants
- **Layout demos** - grids, flex layouts, spacing
- **Animation demos** - pulse, bounce, spin, ping effects

### DemoPage (interactive dashboard demo)
- **Moderate usage** - 50+ instances
- **Interactive elements** - performance metrics, notifications, quick actions
- **Form elements** - inputs, selects, switches
- **Tabs & dialogs** - settings panel, modals

### Navigation (header)
- **Button component x4** - nav items
- **Custom styling** - technical-border aesthetic

### App.tsx (root)
- **ThemeProvider** - wraps entire app
- **Footer** - theme toggle button
- **Page orchestration** - routing and layout

## Key Files by Purpose

### Styling
- `/src/styles/globals.css` (842 lines) - ALL styling in one place
  - CSS variables for all 5 themes
  - 100+ custom classes
  - Responsive adjustments
  - Typography scales
  - Prose/markdown styles

### Components
- `/src/components/ui/button.tsx` - CVA-based button (6 variants)
- `/src/components/ui/card.tsx` - Compound component (6 subcomponents)
- `/src/components/ui/dialog.tsx` - Radix modal with animations
- `/src/components/ui/tabs.tsx` - Radix tabbed interface
- `/src/components/ui/switch.tsx` - Radix toggle switch
- `/src/components/ui/badge.tsx` - CVA badge (4 variants)
- `/src/components/ui/tooltip.tsx` - Radix tooltip with animations

### Configuration
- `/src/contexts/ThemeContext.tsx` - Theme state management
- `/src/lib/utils.ts` - `cn()` utility function only
- `/tailwind.config.js` - Minimal, extends with CSS variables
- `/src/main.tsx` - Entry point with ThemeProvider

### Pages
- `/src/pages/HomePage.tsx` - Main content (README + blog)
- `/src/pages/DesignSystem.tsx` - Component showcase (656 lines)
- `/src/pages/DemoPage.tsx` - Interactive dashboard (415 lines)

## Dependencies You Have

### Component Primitives (Radix UI)
```json
{
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-switch": "^1.2.6",
  "@radix-ui/react-tabs": "^1.1.13",
  "@radix-ui/react-tooltip": "^1.2.8",
  "@radix-ui/react-slot": "^1.2.4"
}
```

### Styling & Utilities
```json
{
  "tailwindcss": "^3.4.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

### Content & Display
```json
{
  "lucide-react": "^0.553.0",
  "react-syntax-highlighter": "^16.1.0",
  "shiki": "^3.15.0",
  "medium-zoom": "^1.1.0"
}
```

## Replacement Candidates (Ranked)

### Must Consider Replacing (High Conflict with Aesthetic)
1. **Dialog** - Has CSS animations that conflict with Web 1.0 aesthetic
2. **Tooltip** - Complex animations/positioning may not fit retro theme

### Good Candidates (Medium Priority)
3. **Tabs** - Could use simpler HTML-based approach
4. **Switch** - Could use basic HTML checkbox
5. **Card** - Very heavy usage (50+ instances), could simplify
6. **Badge** - Simple enough, but could be plain `<span>`

### Lower Priority (Working Well)
7. **Button** - CVA variants work nicely but could be simpler

## Quick Stats

- **Total files in /src**: ~20 files
- **Total components**: 13 (7 UI + 6 custom)
- **Average file size**: 40-200 lines (except CSS)
- **Largest file**: globals.css (842 lines)
- **Smallest file**: utils.ts (6 lines)
- **Total component instances**: 150+ across pages
- **Most used component**: Button & Card (50+ each)
- **Least used**: Dialog (4 instances)

## Color Scheme Examples

### Dark Theme (Default - Terminal Green)
```
--bg: #000000         (black background)
--text: #00ff00       (neon green text)
--border: #00ff00     (green borders)
--accent: #00ff00     (green highlights)
--link: #00ffff       (cyan links)
```

### Light Theme
```
--bg: #fafafa         (off-white)
--text: #1a1a1a       (dark gray text)
--border: #d1d5db     (light gray borders)
--accent: #2563eb     (blue buttons)
--link: #0969da       (blue links)
```

## Things Working Well
- Theme switching system is elegant
- CSS variable approach scales well
- Monospace aesthetic is consistent
- Compound components (especially Card) are reusable
- Clean folder structure
- TypeScript throughout

## Things To Consider Improving
- 842-line CSS file could be split by component/section
- 50+ Card instances in one page = template/loop opportunity
- Radix dependency for simple interactions
- Animation config disabled but CSS animations still used (inconsistency)
- Some custom CSS classes could be consolidated

## How to Find Components

- **UI components**: `/src/components/ui/*.tsx`
- **Custom components**: `/src/components/*.tsx`
- **Pages using them**: `/src/pages/*.tsx`
- **Styling rules**: `/src/styles/globals.css`
- **Theme logic**: `/src/contexts/ThemeContext.tsx`
- **Layout orchestration**: `/src/App.tsx`

---

**Total codebase complexity: MODERATE**
- Not a heavy framework dependency load
- Good separation of concerns
- Clear theming strategy
- Main complexity is custom CSS for aesthetic
