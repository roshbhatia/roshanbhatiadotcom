<!--
Sync Impact Report:
Version: N/A → 1.0.0 (Initial constitution ratification)

Changes:
- ✅ NEW: Core Principles established (5 principles)
  1. Simplicity First - Zero build complexity
  2. Static-First Architecture - Pure HTML/CSS/JS
  3. Aesthetic Consistency - Retro dungeon theme
  4. Accessibility Standards - Inclusive design
  5. Deployment Automation - Zero-friction CI/CD

- ✅ NEW: Code Style Standards
  - File organization in public/
  - Naming conventions (kebab-case)
  - CSS variable namespacing

- ✅ NEW: Development Workflow
  - Local development with yarn
  - Manual testing requirements
  - Git workflow standards

Template Updates Required:
- ✅ plan-template.md: Updated constitution check references to match new principles
- ✅ spec-template.md: No changes needed (technology-agnostic requirements align)
- ✅ tasks-template.md: Updated to reflect static site development (no test infrastructure by default)

Follow-up TODOs:
- None - all placeholders filled
-->

# roshanbhatiadotcom Constitution

## Core Principles

### I. Simplicity First

**Directive**: The website MUST remain a pure static site with zero build complexity.

**Rules**:
- NO build process, bundlers, transpilers, or compilation steps
- NO frontend frameworks (React, Vue, etc.)
- Dependencies limited to development server only (`serve` package)
- Vanilla HTML/CSS/JavaScript exclusively
- All source code directly runnable in browser without transformation

**Rationale**: Build complexity adds maintenance burden, deployment friction, and cognitive overhead for a personal website. The site's purpose—showcasing personal projects and aesthetics—requires zero tooling beyond a static file server.

### II. Static-First Architecture

**Directive**: All website content MUST be served directly from the `public/` directory.

**Rules**:
- Main entry point: `public/index.html`
- Styles: `public/assets/css/`
- Images/assets: `public/assets/img/`
- Fonts: `public/assets/fonts/`
- NO server-side rendering, APIs, or dynamic backends
- Content updates via direct file edits only

**Rationale**: Static-first architecture ensures maximum portability, zero-cost hosting via GitHub Pages, instant load times, and eliminates entire classes of security vulnerabilities associated with dynamic backends.

### III. Aesthetic Consistency

**Directive**: All visual changes MUST maintain the retro 90s/Daggerfall dungeon aesthetic.

**Rules**:
- Preserve Win95-style UI elements (modal windows, system chrome)
- Maintain dungeon theme: torch animations, pixel art sprites, stone textures
- Use existing color palette defined in CSS variables (`--win95-*` colors)
- New visual elements MUST match pixel art/retro style
- Interactive animations (goblins, skeletons, torches) MUST remain functional

**Rationale**: The unique retro aesthetic is the site's primary differentiator and personal brand. Consistency creates memorable user experience and demonstrates design commitment.

### IV. Accessibility Standards

**Directive**: All features MUST support keyboard navigation and screen readers.

**Rules**:
- Interactive elements MUST be keyboard accessible (Tab, Enter, Esc)
- Modal dialogs MUST trap focus and be dismissible via Esc
- Images MUST have descriptive alt text
- Semantic HTML MUST be used (nav, main, section, article)
- Color contrast MUST meet WCAG AA standards minimum
- Animations MUST respect prefers-reduced-motion media query

**Rationale**: Accessibility is non-negotiable. The aesthetic theme should enhance, not hinder, usability for all visitors regardless of ability or assistive technology used.

### V. Deployment Automation

**Directive**: Deployment MUST be fully automated via GitHub Actions with zero manual steps.

**Rules**:
- Push to `main` branch triggers automatic deployment to GitHub Pages
- NO manual FTP uploads, SSH copies, or build steps
- GitHub Actions workflow (`.github/workflows/deploy.yml`) is source of truth
- Deployment MUST complete in under 5 minutes
- Failed deployments MUST be immediately visible in GitHub UI

**Rationale**: Manual deployment creates friction, increases error risk, and wastes time. Automated CI/CD enables fearless iteration and immediate user-facing updates.

## Code Style Standards

### File Organization

**Structure**:
```
public/
├── index.html          # Main entry point
├── assets/
│   ├── css/
│   │   └── style.css   # All styles (animations, layout, components)
│   ├── img/            # Images, sprites, textures
│   └── fonts/          # Custom fonts
└── CNAME               # GitHub Pages domain config
```

**Rules**:
- All source files MUST reside in `public/` directory
- CSS organized by section: animations → layout → components
- Images grouped by purpose (sprites, UI elements, textures)
- NO nested subdirectories beyond shown structure

### Naming Conventions

**CSS Classes**: kebab-case
```css
.modal-content
.scroll-container
.torch-animation
```

**CSS Variables**: Namespaced prefixes
```css
--fx-*           /* Animations/effects */
--win95-*        /* Win95 theme colors */
```

**Files**: kebab-case for multi-word names
```
hanging-sign.png
knight-cat.avif
```

**Rationale**: Consistent naming reduces cognitive load, enables quick file searches, and prevents naming conflicts.

### CSS Guidelines

**Organization in style.css**:
1. CSS variables (colors, animation durations)
2. Animation keyframes
3. Layout (grid, flexbox, positioning)
4. Components (modals, buttons, containers)
5. Media queries

**Rules**:
- Use CSS variables for all colors and reusable values
- Group related selectors together
- Maintain Win95/retro dungeon color palette
- Comment complex selectors and animations
- Avoid `!important` unless absolutely necessary

### JavaScript

**Rules**:
- Vanilla JavaScript only (no jQuery, Lodash, etc.)
- Inline scripts in `index.html` for simplicity
- Use modern ES6+ syntax (const/let, arrow functions, template literals)
- Group related functions together
- Add comments for non-obvious logic

**Example pattern**:
```javascript
// Modal management
const openModal = (modalId) => { /* ... */ };
const closeModal = (modalId) => { /* ... */ };
```

## Development Workflow

### Local Development

**Commands**:
```bash
yarn install          # Install dependencies (serve package)
yarn start           # Serve at http://localhost:3000
```

**Process**:
1. Make changes to files in `public/`
2. Refresh browser to see updates (no hot reload)
3. Test interactivity manually (modals, animations, links)
4. Verify accessibility (keyboard navigation, screen readers)
5. Commit changes with conventional commit messages

### Manual Testing Requirements

Since NO automated tests exist (pure static site), changes MUST be manually verified:

**Checklist before commit**:
- [ ] All links navigate correctly
- [ ] Modals open/close via click and keyboard (Esc)
- [ ] Animations play smoothly (torch, sprites)
- [ ] Layout responsive on mobile/tablet/desktop
- [ ] Keyboard navigation works (Tab through interactive elements)
- [ ] No console errors in browser DevTools
- [ ] Images load correctly (check Network tab)

**Rationale**: Manual testing is acceptable for a personal static site with limited scope. Automated testing would add complexity disproportionate to benefit.

### Git Workflow

**Branch Strategy**: Direct commits to `main` (single-person project)

**Commit Message Format** (Conventional Commits):
```
<type>(<scope>): <description>

Examples:
feat(modal): add new project showcase modal
fix(css): correct torch animation timing
chore(deps): update serve package
docs(readme): add development instructions
```

**Types**: feat, fix, chore, docs, style, refactor

**Rules**:
- Commit frequently (logical chunks of work)
- Push to `main` triggers automatic deployment
- NO force-push to `main` (preserves history)

## Governance

### Amendment Process

**Requirements**:
1. Document proposed change and rationale
2. Verify no existing principle prohibits change
3. Update this constitution with new version number
4. Update dependent templates if principle changes affect workflow

**Version Bumping**:
- **MAJOR** (X.0.0): Remove/redefine core principle or allow prohibited technology (e.g., introducing build process)
- **MINOR** (1.X.0): Add new principle, expand existing guidance, new mandatory practice
- **PATCH** (1.0.X): Clarifications, typo fixes, wording improvements

### Compliance Review

**Frequency**: Before merging any significant feature or redesign

**Verification**:
1. Changes align with Simplicity First (no new build steps)
2. Changes align with Static-First (no dynamic backends)
3. Changes align with Aesthetic Consistency (retro theme preserved)
4. Changes align with Accessibility Standards (keyboard + screen reader tested)
5. Changes align with Deployment Automation (GitHub Actions still works)

**Enforcement**: Self-enforced (single maintainer project). This constitution serves as decision framework, not external compliance requirement.

### Complexity Justification

Any violation of core principles MUST be documented with:
- What principle is violated
- Why violation is necessary (specific problem solved)
- Why simpler alternatives were rejected

**Example**:
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Adding build step (PostCSS) | CSS variables insufficient for theme switching | Increases complexity; theme switching not required |

**Version**: 1.0.0 | **Ratified**: 2023-06-02 | **Last Amended**: 2025-01-07
