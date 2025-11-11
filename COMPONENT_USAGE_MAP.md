# Component Usage Map - Visual Summary

## Component Dependency Chart

```
┌─────────────────────────────────────────────────────────────┐
│                     App.tsx (Root)                           │
│  ┌─────────────────┬───────────────────────────────────────┐ │
│  │ ThemeProvider   │ Footer (theme toggle button)          │ │
│  │  & Context      │ ├── Button (CVA variant: default)     │ │
│  │                 │ └── Custom CSS classes                │ │
│  └─────────────────┴───────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──────┐  ┌───▼──────┐  ┌───▼──────────────┐
    │HomePage  │  │Navigation│  │  DesignSystem    │
    │          │  │          │  │      Page        │
    │Uses:     │  │Uses:     │  │   (Showcase)     │
    │• Writing │  │• Button  │  │   Uses 100+      │
    │  Section │  │  x4 nav  │  │   component      │
    │• GitHub  │  │  items   │  │   instances      │
    │  README  │  │          │  │                  │
    └──────────┘  └──────────┘  └──────────────────┘
         │
    Shiki (syntax
    highlighting)
```

## Component Usage by File

### /src/components/ui/ (7 Components)

```
┌──────────────────────────────────────────────────────────────┐
│ BUTTON.TSX (139 lines)                                       │
├──────────────────────────────────────────────────────────────┤
│ Base: CVA (class-variance-authority)                         │
│ Variants: default | destructive | outline | secondary |      │
│           ghost | link                                       │
│ Sizes: sm | default | lg | icon                             │
│ Props: asChild (for Slot wrapping)                          │
│ Used in: Navigation, DesignSystem (20+), DemoPage (20+)    │
│ Radix Deps: @radix-ui/react-slot                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ CARD.TSX (79 lines)                                          │
├──────────────────────────────────────────────────────────────┤
│ Base: React.forwardRef<HTMLDivElement>                       │
│ Compound Components:                                         │
│   • Card (root)                                              │
│   • CardHeader (flex col space-y-1.5 p-6)                    │
│   • CardTitle (h3 2xl semibold mono)                         │
│   • CardDescription (p sm text-border mono)                 │
│   • CardContent (div p-6 pt-0)                               │
│   • CardFooter (flex items-center p-6 pt-0)                 │
│ Used in: DesignSystem (30+), DemoPage (15+),               │
│          AnimationShowcase (4)                               │
│ Heavy reuse: Most verbose component                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ DIALOG.TSX (120 lines)                                       │
├──────────────────────────────────────────────────────────────┤
│ Base: @radix-ui/react-dialog                                 │
│ Compound Components:                                         │
│   • Dialog (Root)                                            │
│   • DialogTrigger                                            │
│   • DialogPortal                                             │
│   • DialogOverlay (with animations)                          │
│   • DialogContent (centered, animated)                       │
│   • DialogHeader (flex flex-col space-y-1.5)                │
│   • DialogFooter (flex flex-col-reverse sm:flex-row)        │
│   • DialogTitle (lg semibold mono)                           │
│   • DialogDescription (sm text-border mono)                 │
│   • DialogClose                                              │
│ Animations: Multiple (fade-in, zoom-in, slide)              │
│ Icons: X (lucide-react)                                      │
│ Used in: DesignSystem (2), DemoPage (2+)                     │
│ Note: Contains animations conflicting with Web 1.0 theme    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TABS.TSX (53 lines)                                          │
├──────────────────────────────────────────────────────────────┤
│ Base: @radix-ui/react-tabs                                   │
│ Compound Components:                                         │
│   • Tabs (Root)                                              │
│   • TabsList (inline-flex h-9 border rounded-lg)             │
│   • TabsTrigger (inline-flex py-1 px-3)                      │
│   • TabsContent (mt-2)                                       │
│ Used in: DesignSystem (1 with 8 tabs),                       │
│          DemoPage (1 with 3 tabs)                            │
│ State: data-[state=active] for active tab styling           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SWITCH.TSX (27 lines)                                        │
├──────────────────────────────────────────────────────────────┤
│ Base: @radix-ui/react-switch                                 │
│ Structure:                                                   │
│   • SwitchPrimitives.Root (h-5 w-9 rounded-full)            │
│   • SwitchPrimitives.Thumb (h-4 w-4 translated)             │
│ States: checked | unchecked                                  │
│ Used in: DesignSystem (5+), DemoPage (2+)                    │
│ Props: checked, onCheckedChange                              │
│ Animations: translate transform with transition             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ BADGE.TSX (36 lines)                                         │
├──────────────────────────────────────────────────────────────┤
│ Base: CVA (class-variance-authority)                         │
│ Variants: default | secondary | destructive | outline        │
│ Props: className, variant                                    │
│ Used in: DesignSystem (15+), DemoPage (5+)                   │
│ Common usage: Status indicators, tags                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ TOOLTIP.TSX (28 lines)                                       │
├──────────────────────────────────────────────────────────────┤
│ Base: @radix-ui/react-tooltip                                │
│ Compound Components:                                         │
│   • TooltipProvider (wrapper)                                │
│   • Tooltip (Root)                                           │
│   • TooltipTrigger                                           │
│   • TooltipContent (rounded-md border, animated)             │
│ Animation: fade-in-0 zoom-in-95 + side-specific slides      │
│ Used in: DesignSystem (5+), DemoPage (10+)                   │
│ Usually: Wrapping buttons or links                           │
└──────────────────────────────────────────────────────────────┘
```

## Custom Components

```
┌──────────────────────────────────────────────────────────────┐
│ NAVIGATION.TSX (45 lines)                                    │
├──────────────────────────────────────────────────────────────┤
│ Props: currentPage, onPageChange                             │
│ Uses: Button component (4 nav items)                         │
│ Styling: technical-border, bg-bg/50                          │
│ Display: Flex layout with logo + nav items + status         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ LOADINGSPINNER.TSX (42 lines)                                │
├──────────────────────────────────────────────────────────────┤
│ Props: size (sm|md|lg), className                            │
│ Implementation: SVG circle + path with animate-spin          │
│ Used in: DesignSystem (3 demo instances)                     │
│ Animation: Pure CSS rotate (no Tailwind animation)           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ANIMATIONSHOWCASE.TSX (69 lines)                             │
├──────────────────────────────────────────────────────────────┤
│ Uses: Card (4), Button (4)                                   │
│ Demos: Pulse, Bounce, Spin, Ping animations                 │
│ Used in: DesignSystem (Animations tab)                       │
│ Animations: animate-pulse, animate-bounce, animate-spin,    │
│            animate-ping (from Tailwind)                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ IMAGEZOOM.TSX (46 lines)                                     │
├──────────────────────────────────────────────────────────────┤
│ Props: src, alt, className                                   │
│ Dependency: medium-zoom (v1.1.0)                             │
│ Functionality: Click to zoom image                           │
│ Used in: HomePage (WritingSection)                           │
│ CSS: cursor: zoom-in on hover                                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ WRITINGSECTION.TSX (15,350+ lines generated)                 │
├──────────────────────────────────────────────────────────────┤
│ Purpose: Display blog/writing content                        │
│ Generated: writings.generated.ts (auto-generated)            │
│ Uses: Shiki for syntax highlighting                          │
│ Used in: HomePage                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ GITHUBREADME.TSX (in HomePage)                               │
├──────────────────────────────────────────────────────────────┤
│ Purpose: Fetch and display GitHub README                     │
│ Data: Fetch from GitHub raw API (with CORS proxy)           │
│ Fallback: Static text content                                │
│ States: loading, error, content                              │
│ Used in: HomePage                                            │
└──────────────────────────────────────────────────────────────┘
```

## CSS & Theme System

```
┌──────────────────────────────────────────────────────────────┐
│ GLOBALS.CSS (842 lines) - MAIN STYLING FILE                 │
├──────────────────────────────────────────────────────────────┤
│ @layer base:                                                 │
│   - CSS Variables for 5 themes (dark, light, gruv-light,    │
│     gruv-dark, nord-dark)                                    │
│   - 24 variables per theme                                   │
│   - Body styling (font, line-height)                        │
│   - Text classes (text-hero, text-section, etc.)             │
│   - Spacing system (space-xs through space-3xl)              │
│   - Grid patterns (engineering-grid)                         │
│   - Technical styling (technical-border, corner-markers)    │
│   - Prose styles (h1-h6, lists, code, links)                │
│   - Code styling (inline-code, code blocks)                 │
│   - Responsive adjustments (768px, 480px)                   │
│                                                              │
│ @layer components:                                           │
│   - Glass effects                                            │
│   - Focus rings                                              │
│   - Schematic containers                                     │
│   - Technical grids                                          │
│   - Shiki wrapper overrides                                  │
│   - Medium Zoom z-index                                      │
│   - Industrial dividers                                      │
│                                                              │
│ Custom Classes: 100+                                         │
│   - `.engineering-grid` - Graph paper background            │
│   - `.technical-border` - Retro borders                      │
│   - `.sheet-border` - Layered border                        │
│   - `.cell-border` - Cell with corner dots                   │
│   - `.corner-markers` - Corner decorations                   │
│   - `.measurement-indicators` - Ruler marks                  │
│   - `.content-card`, `.content-text` - Content boxes         │
│   - `.schematic-section` - Technical sections                │
│   - `.theme-toggle` - Theme button styling                   │
│   - `.code-block` - Code styling with label                 │
│   - Typography scales (h1-h6)                                │
│   - Spacing helpers                                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ THEMECONTEXT.TSX (57 lines)                                  │
├──────────────────────────────────────────────────────────────┤
│ Context: ThemeContextType                                    │
│   - theme: 'dark' | 'light' | 'gruvbox-light' | etc.        │
│   - toggleTheme: () => void (toggle dark/light)             │
│   - cycleTheme: () => void (cycle through all 5)            │
│                                                              │
│ Storage: LocalStorage ('theme' key)                         │
│ Application: document.documentElement data-theme attribute  │
│ Default: 'dark'                                              │
│                                                              │
│ Hook: useTheme() - Safe for SSR/static gen                  │
└──────────────────────────────────────────────────────────────┘
```

## Page-Level Usage Summary

```
HOMEPAGE (129 lines)
├── No UI components
├── Uses: WritingSection, GitHubReadme  
├── Styling: Custom CSS classes only
│   └── content-section, content-text, technical-grid
└── Content: README + Writing sections

DESIGNSYSTEM (656 lines) *** HEAVIEST USAGE ***
├── Button: 20+ instances
├── Card: 30+ instances (most using subcomponents)
├── Badge: 15+ instances
├── Dialog: 2 instances
├── Tabs: 1 (8 tabs)
├── Switch: 5+ instances
├── Tooltip: 5+ instances
├── LoadingSpinner: 3 instances
├── AnimationShowcase: 1 (with 4 cards + 4 buttons)
└── Purpose: Comprehensive component showcase

DEMOPAGE (415 lines) *** MODERATE USAGE ***
├── Card: 15+ instances
├── Button: 20+ instances
├── Badge: 5+ instances
├── Dialog: 2 instances
├── Tabs: 1 (3 tabs)
├── Switch: 2+ instances
├── Tooltip: 10+ instances (with TooltipProvider)
└── Purpose: Interactive dashboard demo

NAVIGATION (45 lines)
├── Button: 4 instances (nav items)
└── Purpose: Page navigation header

APP.TSX (63 lines) *** ROOT ORCHESTRATION ***
├── ThemeProvider (wraps everything)
├── Footer: 1 (with theme toggle button)
└── Orchestrates: Navigation, HomePage, theme styling
```

## Dependency Flow

```
Third-party Dependencies
│
├── Radix UI Primitives (accessibility)
│   ├── @radix-ui/react-dialog ──→ Dialog component
│   ├── @radix-ui/react-switch ──→ Switch component
│   ├── @radix-ui/react-tabs ────→ Tabs component
│   ├── @radix-ui/react-tooltip ─→ Tooltip component
│   └── @radix-ui/react-slot ────→ Button asChild prop
│
├── Styling & CSS
│   ├── tailwindcss ─────────────→ Utility classes
│   ├── class-variance-authority ─→ Button & Badge variants
│   ├── clsx + tailwind-merge ───→ cn() utility function
│   └── postcss ─────────────────→ CSS processing
│
├── Content & Code Display
│   ├── react-syntax-highlighter ─→ Legacy code highlighting
│   ├── shiki ───────────────────→ Modern syntax highlighting
│   └── lucide-react ────────────→ Dialog close icon (X)
│
└── UI Enhancements
    └── medium-zoom ────────────→ ImageZoom component
```

## Component Reusability Index

```
Most Reused (Refactoring Candidates)
│
├── ⭐⭐⭐⭐⭐ Card
│   └── 50+ instances across 3 showcase pages
│
├── ⭐⭐⭐⭐⭐ Button
│   └── 50+ instances across all pages
│
├── ⭐⭐⭐⭐ Badge
│   └── 25+ instances for status/tags
│
├── ⭐⭐⭐⭐ Tooltip
│   └── 15+ instances for help text
│
├── ⭐⭐⭐ Tabs
│   └── 2 major tabbed interfaces
│
├── ⭐⭐⭐ Dialog
│   └── Modal showcase examples
│
├── ⭐⭐ Switch
│   └── Form controls demo
│
└── ⭐ Custom Components
    └── Low reuse, very specific
```
