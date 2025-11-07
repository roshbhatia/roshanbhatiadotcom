# Feature Specification: Static Blog System

**Feature ID:** 001-001  
**Feature Name:** static-blog-system  
**Status:** Draft  
**Created:** 2025-01-07  
**Last Updated:** 2025-01-07

## Overview

Add a blog system to the personal website that supports Markdown compilation while maintaining the static-only architecture, mobile-responsive design, and retro dungeon aesthetic.

## Background

Currently, the site is a single-page static HTML site with no blog functionality. Users want to add written content (blog posts) without compromising the site's performance, aesthetic, or static nature.

### Constitution Considerations

**Potential Conflict:** Constitution Principle I states "Static-only, no build process" but Markdown compilation inherently requires a build step.

**Proposed Resolution:** Amend the constitution to allow a minimal build process specifically for Markdown-to-HTML compilation, while maintaining the principle that the deployed site remains static HTML/CSS/JS with no client-side framework dependencies.

## User Stories

### P1: Core Blog Functionality
- **As a** site visitor  
  **I want to** read blog posts in a clean, readable format  
  **So that** I can consume written content easily

- **As a** content author  
  **I want to** write posts in Markdown  
  **So that** I can focus on content without dealing with HTML

### P2: Navigation & Discovery
- **As a** site visitor  
  **I want to** see a list of all blog posts with dates and excerpts  
  **So that** I can discover and navigate to content that interests me

- **As a** site visitor  
  **I want to** access the blog from the main site navigation  
  **So that** I can easily find written content

### P3: Mobile Experience
- **As a** mobile user  
  **I want to** read blog posts on my phone with proper formatting  
  **So that** content is accessible on any device

## Functional Requirements

### Blog Structure
1. **REQ-001:** Blog posts shall be written in Markdown format
2. **REQ-002:** Each blog post shall include frontmatter with: title, date, excerpt/description, optional tags
3. **REQ-003:** Blog posts shall be stored in a dedicated directory (e.g., `posts/` or `content/blog/`)
4. **REQ-004:** System shall generate individual HTML pages for each blog post
5. **REQ-005:** System shall generate a blog index/listing page showing all posts

### Markdown Processing
6. **REQ-006:** System shall compile Markdown to HTML during build process
7. **REQ-007:** System shall support standard Markdown syntax (headings, lists, links, images, code blocks)
8. **REQ-008:** Code blocks shall include syntax highlighting
9. **REQ-009:** External links shall open in new tabs
10. **REQ-010:** Images shall be responsive and scale to container width (max-width: 100%, height: auto)

### Static Site Generation
11. **REQ-011:** Build process shall output static HTML files only
12. **REQ-012:** Generated pages shall not require JavaScript for core content rendering
13. **REQ-013:** Build process shall be triggered via npm/yarn script
14. **REQ-014:** Generated files shall be built during CI/CD pipeline and not committed to repository (gitignored in `public/blog/`)

### Navigation & Layout
15. **REQ-015:** Main site shall include a "Blog" link in the Win95 menu bar navigation
16. **REQ-016:** Blog index page shall display posts in reverse chronological order (newest first)
17. **REQ-017:** Each blog post entry on index shall show: title, date, excerpt
18. **REQ-018:** Blog post pages shall include a "Back to Blog" navigation link
19. **REQ-019:** Blog post pages shall include a "Home" link to return to main site

### Typography & Styling
20. **REQ-020:** Blog content text shall use JetBrains Mono font (as specified)
21. **REQ-021:** Blog pages shall maintain the Win95/dungeon retro aesthetic
22. **REQ-022:** Blog layout shall use Win95 window chrome (title bar, borders) with dungeon-themed content area
23. **REQ-023:** Headings, paragraphs, and lists shall have spacing of at least 1em between elements for readability
24. **REQ-024:** Code blocks shall have syntax highlighting with a retro/terminal color scheme

### Mobile Responsiveness
25. **REQ-025:** Blog index and post pages shall be fully responsive
26. **REQ-026:** Text shall be readable on mobile without horizontal scrolling
27. **REQ-027:** Touch targets (links, navigation) shall meet accessibility standards (44x44px minimum)
28. **REQ-028:** Images shall scale appropriately on mobile devices

### Metadata & SEO
29. **REQ-029:** Each blog post page shall have appropriate meta tags (title, description)
30. **REQ-030:** Blog pages shall maintain consistent header/footer elements for branding

## Non-Functional Requirements

### Performance
- **NFR-001:** Blog pages shall load in under 2 seconds on 3G connections
- **NFR-002:** Generated HTML files shall be under 100KB each (excluding images)

### Build Performance
- **NFR-003:** Build process shall complete in under 30 seconds for up to 50 blog posts

### Code Quality
- **NFR-004:** Build scripts shall be documented and maintainable

## Success Criteria

1. ✅ Authors can write blog posts in Markdown files
2. ✅ Running build command generates static HTML blog pages
3. ✅ Blog index page displays all posts with dates and excerpts
4. ✅ Individual blog post pages render content correctly
5. ✅ Navigation between main site, blog index, and posts works seamlessly
6. ✅ Blog pages are mobile-responsive and readable on phones
7. ✅ Code blocks in posts have syntax highlighting
8. ✅ Site can be deployed to GitHub Pages without changes to deployment workflow

## Edge Cases

1. **Empty blog state:** What should blog index show when no posts exist? → See T126 (Phase 9)
2. **Very long post titles:** How should truncation/wrapping work on index page? → See T127 (Phase 9)
3. **Large images in posts:** How to handle image optimization and loading? → See T128, T138 (Phase 9)
4. **Markdown syntax errors:** How should build process handle malformed Markdown? → Handled by 11ty build error reporting
5. **Missing frontmatter:** What defaults should be used if title/date/excerpt are missing? → See T129 (Phase 9)
6. **Special characters in URLs:** How should post URLs be sanitized from titles? → See T130 (Phase 9)
7. **Draft posts:** Should there be a mechanism to exclude posts from build? → See T131 (Phase 9)
8. **Post updates:** How should post modification dates be handled? → See T132 (Phase 9)
9. **Cross-browser compatibility:** Ensure Win95 aesthetic works across browsers → See T133-T136 (Phase 9)

## Resolved Questions

### 1. Static Site Generator Choice
**Question:** Which static site generator should we use?

**Decision:** 11ty (Eleventy)

**Rationale:**
- JavaScript-based, aligns with existing npm/yarn tooling
- Minimal configuration, flexible templating
- Good fit for small-to-medium sites
- Active community and documentation
- Faster learning curve than Hugo for JavaScript developers

---

### 2. Blog Post URL Pattern
**Question:** What URL structure should blog posts use?

**Decision:** Flat structure (`/blog/post-title.html`)

**Rationale:**
- Simpler directory organization
- Easier to maintain and debug
- Permalink stability (no year/month refactoring needed)
- Lower complexity for initial implementation
- Can migrate to date-based structure later if needed

---

### 3. Initial Content Migration
**Question:** Do you have existing blog content that needs to be migrated?

**Decision:** No existing content to migrate

**Rationale:**
- Fresh blog system starting from scratch
- First post will be created as part of testing/validation
- No migration complexity needed in initial implementation

## Implementation Notes

### Proposed Tech Stack
- **Static Site Generator:** 11ty (Eleventy) - JavaScript-based, minimal configuration, flexible templating
- **Markdown Parser:** Likely built into chosen SSG
- **Syntax Highlighting:** Prism.js or Highlight.js with retro theme
- **Fonts:** JetBrains Mono (already specified for blog text)
- **Deployment:** No changes needed - GitHub Pages via existing workflow

### Directory Structure (Proposed)
```
roshanbhatiadotcom/
├── posts/                    # Markdown source files
│   ├── 2025-01-07-first-post.md
│   └── ...
├── public/                   # Existing static assets
│   ├── blog/                 # Generated blog HTML (gitignored or committed)
│   │   ├── index.html
│   │   └── posts/
│   │       └── first-post.html
│   └── ...
├── _includes/               # Templates (if using 11ty)
│   ├── layouts/
│   │   ├── blog-post.html
│   │   └── blog-index.html
└── package.json             # Updated with build scripts
```

### Build Integration
- Add `build:blog` script to `package.json`
- Update deployment workflow to run build before deploy
- Generated files in `public/blog/` are gitignored and built during CI/CD

---

## Next Steps

1. **User to answer open questions** (SSG choice, URL pattern, content migration needs)
2. **Update constitution** if needed to allow minimal build process
3. **Create implementation plan** breaking down requirements into tasks
4. **Set up chosen static site generator** and configure
5. **Create blog templates** matching Win95/dungeon aesthetic
6. **Implement Markdown processing** with syntax highlighting
7. **Update main site navigation** to include blog link
8. **Test on mobile devices** and iterate on responsive design
9. **Deploy and validate** on GitHub Pages

---

## Related Documents
- `.specify/memory/constitution.md` - Project principles and constraints
- `AGENTS.md` - Development guidelines and commands
- `.github/workflows/deploy.yml` - Deployment automation
