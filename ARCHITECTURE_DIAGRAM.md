# Architecture Diagram & Visual Overview

## Overall Application Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ROSHANBHATIA.COM                            │
│                    (Vite React + TypeScript)                         │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼──────────┐    ┌────────▼─────────┐
            │  Styling Layer   │    │  Component Layer │
            └──────────────────┘    └──────────────────┘
                    │                         │
    ┌───────────────┼─────────────┐          │
    │               │             │          │
 CSS Variables  Tailwind CSS   Custom CSS   Components
    │               │             │          │
    │          +utilities+      +100         │
    │          +layout+         classes    ├─ 7 UI Components
    │          +colors+         for web    │  (shadcn-style)
    │                           1.0        │
    │                           aesthetic  └─ 6 Custom
    │                                         Components
    │
 5 Themes:
 • dark (green terminal)
 • light (paper)
 • gruvbox-light
 • gruvbox-dark
 • nord-dark
```

## Component Hierarchy

```
                          App.tsx (Root)
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ThemeProvider          Navigation
                    │                   │
            ┌───────┴───────┐       Button x4
            │               │       (nav items)
         HomePage       Footer
            │               │
            │          Button (theme)
    ┌───────┴────────┐
    │                │
WritingSection  GitHubReadme
    │
Shiki Highlighting


                     DesignSystem Page
                      (656 lines)
            ┌───────────┬────────────┐
            │           │            │
        Tabs x1    Button x20+    Card x30+
        │          │              │
    TabsList    variants      subcomponents:
    TabsTrigger sizes            Header
    TabsContent              Title
            │                Description
        Content              Content
        spaces               Footer
        │
    ├─ Buttons tab
    ├─ Cards tab
    ├─ Forms tab
    ├─ Badges tab (Badge x15)
    ├─ Dialogs tab (Dialog x2, Tooltip x5)
    ├─ Loading tab (LoadingSpinner x3)
    ├─ Animations tab (AnimationShowcase)
    └─ Layout tab


                      DemoPage (415 lines)
                ┌────────┬─────────┬────────┐
                │        │         │        │
            Dashboard Settings   Forms   Interactions
                │        │         │        │
            Card x15  Tabs x1   Switch x2  Badge x5
            Button x20          Tooltip x10
```

## Data Flow: Theming

```
User clicks theme toggle (Footer)
         │
         ▼
    cycleTheme()
         │
         ▼
    ThemeContext.setTheme()
         │
         ├─ Updates state
         │
         ├─ Sets localStorage('theme', newTheme)
         │
         └─ Sets document.documentElement.data-theme="dark"
         │
         ▼
    CSS updates via [data-theme] selector
         │
         ├─ :root [data-theme='dark'] { --bg: #000; --text: #0f0; }
         │ :root [data-theme='light'] { --bg: #fff; --text: #000; }
         │ etc...
         │
         ▼
    All CSS variables update
         │
         ├─ --bg, --text, --border, --accent, etc.
         │
         ▼
    Tailwind classes recompute
         │
         ├─ bg-bg (uses var(--bg))
         │ text-text (uses var(--text))
         │ border-border (uses var(--border))
         │
         ▼
    Custom classes recompute
         │
         └─ .engineering-grid uses var(--grid-color)
            .technical-border uses var(--border)
            .content-card uses var(--cell-bg)
            etc.
         │
         ▼
    Page instantly updates to new theme
```

## File Organization

```
/src/
│
├── /components/
│   ├── /ui/
│   │   ├── button.tsx (139 lines)
│   │   │   └─ CVA variants: default, destructive, outline, secondary, ghost, link
│   │   │   └─ Sizes: sm, default, lg, icon
│   │   │
│   │   ├── card.tsx (79 lines)
│   │   │   └─ Card + CardHeader + CardTitle + CardDescription + CardContent + CardFooter
│   │   │
│   │   ├── dialog.tsx (120 lines)
│   │   │   └─ Dialog + Trigger + Portal + Overlay + Content + Header + Footer + Title + Description + Close
│   │   │
│   │   ├── tabs.tsx (53 lines)
│   │   │   └─ Tabs + List + Trigger + Content
│   │   │
│   │   ├── switch.tsx (27 lines)
│   │   │   └─ Switch + Thumb
│   │   │
│   │   ├── badge.tsx (36 lines)
│   │   │   └─ Variants: default, secondary, destructive, outline
│   │   │
│   │   └── tooltip.tsx (28 lines)
│   │       └─ TooltipProvider + Root + Trigger + Content
│   │
│   ├── Navigation.tsx (45 lines)
│   │   └─ Header nav with Button x4
│   │
│   ├── LoadingSpinner.tsx (42 lines)
│   │   └─ SVG spinner with 3 sizes
│   │
│   ├── AnimationShowcase.tsx (69 lines)
│   │   └─ Demo of Tailwind animations
│   │
│   ├── ImageZoom.tsx (46 lines)
│   │   └─ medium-zoom wrapper
│   │
│   └── [WritingSection.tsx - separate file]
│
├── /contexts/
│   └── ThemeContext.tsx (57 lines)
│       └─ Theme state + cycleTheme() + toggleTheme() + useTheme()
│
├── /pages/
│   ├── HomePage.tsx (129 lines)
│   │   └─ WritingSection + GitHubReadme
│   │
│   ├── DesignSystem.tsx (656 lines)
│   │   └─ Comprehensive showcase (100+ component instances)
│   │
│   └── DemoPage.tsx (415 lines)
│       └─ Interactive dashboard (50+ component instances)
│
├── /styles/
│   └── globals.css (842 lines)
│       ├─ @layer base:
│       │  ├─ CSS variables for 5 themes
│       │  ├─ Body styling
│       │  ├─ 100+ custom classes
│       │  ├─ Typography scales
│       │  ├─ Spacing system
│       │  └─ Prose styles
│       │
│       └─ @layer components:
│          ├─ Utilities
│          └─ Special styles (glass, focus, etc.)
│
├── /lib/
│   └── utils.ts (6 lines)
│       └─ cn() = twMerge(clsx(...))
│
├── App.tsx (63 lines)
│   └─ App structure with ThemeProvider + Navigation + Footer
│
├── main.tsx (11 lines)
│   └─ React DOM render + ThemeProvider
│
├── WritingSection.tsx (large)
│   └─ Blog content display
│
├── WritingSection.generated.ts (auto-generated)
│   └─ Built from /writing folder
│
├── version.ts
│   └─ Git commit SHA injection
│
├── tailwind.config.js
│   └─ Custom colors extending CSS vars
│
└── tsconfig.json
    └─ TypeScript configuration
```

## Component Instance Distribution

```
Component Usage Across Pages:

Button
├─ Navigation:        4 instances (nav items)
├─ Footer:           1 instance (theme toggle)
├─ DesignSystem:    20+ instances (showcase)
├─ DemoPage:        20+ instances (actions)
└─ AnimationShowcase: 4 instances
└─ Total: 50+ instances

Card
├─ DesignSystem:    30+ instances (showcase)
├─ DemoPage:        15+ instances (dashboard)
├─ AnimationShowcase: 4 instances
└─ Total: 50+ instances

Badge
├─ DesignSystem:    15+ instances (showcase)
├─ DemoPage:         5+ instances (status)
└─ Total: 20+ instances

Tooltip
├─ DesignSystem:     5+ instances
├─ DemoPage:        10+ instances (help)
└─ Total: 15+ instances

Dialog
├─ DesignSystem:     2 instances (showcase)
├─ DemoPage:         2+ instances (modals)
└─ Total: 4+ instances

Tabs
├─ DesignSystem:     1 (with 8 tabs)
├─ DemoPage:         1 (with 3 tabs)
└─ Total: 2 instances

Switch
├─ DesignSystem:     5+ instances
├─ DemoPage:         2+ instances
└─ Total: 7+ instances
```

## Styling Layer Breakdown

```
                      STYLING SYSTEM
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    CSS Variables      Tailwind CSS      Custom Classes
         │                  │                  │
    24 variables        Utilities          100+ classes
    per theme           Layout             Web 1.0
    5 themes total      Spacing            aesthetic
    color-based         Sizing
    theme-based         Typography
                        Classes
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                   Applied to Components
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
      Button              Card            Dialog
      └─ bg-accent    └─ border-border  └─ border-border
         text-bg        bg-bg/50           bg-bg
         hover effects   shadow-sm          animations


      Custom Classes Used in Pages:
      
      HomePage:
      ├─ content-section
      ├─ content-text
      └─ technical-grid
      
      DesignSystem & DemoPage:
      ├─ technical-border
      ├─ sheet-border
      ├─ engineering-grid (homepage background)
      ├─ corner-markers
      ├─ measurement-indicators
      └─ schematic-container
```

## Dependency Graph: UI Components

```
                    @radix-ui/react-slot
                            │
                    ┌───────▼────────┐
                    │  Button.tsx    │
                    │ (CVA-based)    │
                    └────────────────┘
                            │
                            ├─ clsx
                            ├─ tailwind-merge
                            └─ class-variance-authority


                @radix-ui/react-dialog
                            │
                    ┌───────▼────────┐
                    │  Dialog.tsx    │
                    │ (Portal Modal) │
                    └────────────────┘
                            │
                            ├─ lucide-react (X icon)
                            └─ className utilities


             @radix-ui/react-switch
                            │
                    ┌───────▼────────┐
                    │  Switch.tsx    │
                    │ (Toggle)       │
                    └────────────────┘


              @radix-ui/react-tabs
                            │
                    ┌───────▼────────┐
                    │  Tabs.tsx      │
                    │ (Tabbed UI)    │
                    └────────────────┘


            @radix-ui/react-tooltip
                            │
                    ┌───────▼────────┐
                    │  Tooltip.tsx   │
                    │ (Hover Info)   │
                    └────────────────┘
                            │
                            └─ className utilities (animations)


                          Card.tsx
                    (React.forwardRef)
                            │
                    ├─ CardHeader
                    ├─ CardTitle
                    ├─ CardDescription
                    ├─ CardContent
                    └─ CardFooter


                          Badge.tsx
                    (CVA-based inline)
                            │
                            ├─ class-variance-authority
                            └─ Variants: default, secondary, destructive, outline
```

## CSS Variable Application Flow

```
globals.css defines:

:root { --bg: #000; --text: #0f0; /* ...22 more */ }
[data-theme="light"] { --bg: #fff; --text: #000; /* ...22 more */ }
[data-theme="gruvbox-light"] { /* ... */ }
[data-theme="gruvbox-dark"] { /* ... */ }
[data-theme="nord-dark"] { /* ... */ }

tailwind.config.js extends:

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

Component usage:

<button className="bg-accent text-bg">
  Expands to:
  <button style="background: var(--accent); color: var(--bg)">

Custom classes:

.technical-border {
  border: 2px solid var(--border);
  background: var(--bg);
}

.engineering-grid {
  background-image: linear-gradient(var(--grid-color) 1px, transparent 1px);
}

When theme changes:
1. data-theme attribute updates
2. CSS re-evaluates [data-theme] selectors
3. --bg, --text, --border variables update
4. All components using var(--xx) update instantly
5. No JavaScript recalculation needed
```

## Build Pipeline

```
Source Files (TypeScript + CSS)
         │
    ┌────┴────┐
    │          │
  .tsx/.ts   .css
    │          │
    ▼          ▼
 TypeScript   PostCSS
 Compiler     + Tailwind
    │          │
    └────┬─────┘
         │
         ▼
   Vite Build
         │
    ┌────┴────┐
    │          │
   JS      CSS (with
   Bundle  variables
           processed)
    │      │
    └──┬───┘
       │
       ▼
    dist/ folder
       │
       ├─ index.html
       ├─ index.js (compiled + minified)
       └─ style.css (compiled + minified)
```

## Performance Characteristics

```
Bundle Size Impact:

Core React:              ~40KB
Radix UI Primitives:     ~80KB (dialog, switch, tabs, tooltip, slot)
Tailwind CSS:            ~50KB
Custom Code:             ~20KB
───────────────────────────────
Total (gzipped):         ~50-70KB

Main CSS File: 842 lines
└─ Minimal file size impact
└─ All themes in single file (minimal CSS overhead)
└─ CSS variables evaluated at parse time (zero runtime cost)

Component Overhead:
├─ Button: Radix Slot wrapper
├─ Card: Plain React.forwardRef
├─ Dialog: Radix Portal (out-of-DOM)
├─ Tabs: Radix (headless)
├─ Switch: Radix (headless)
├─ Badge: Plain wrapper
└─ Tooltip: Radix (headless)

Runtime Performance:
✓ No animations in Tailwind config (disabled)
✓ CSS variables (zero runtime cost)
✓ Minimal JavaScript
✓ Radix primitives are optimized
✓ No heavy dependencies
```

---

This architecture is clean, modular, and well-suited for the Web 1.0 aesthetic with good separation of concerns.
