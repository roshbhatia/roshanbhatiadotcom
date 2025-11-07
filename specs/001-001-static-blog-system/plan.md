# Implementation Plan: Static Blog System

**Branch**: `001-001-static-blog-system` | **Date**: 2025-01-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-001-static-blog-system/spec.md`

## Summary

Add a blog system using 11ty (Eleventy) to compile Markdown posts into static HTML pages while maintaining the retro Win95/dungeon aesthetic and mobile-responsive design. Blog posts will use flat URLs (`/blog/my-post.html`), support syntax highlighting, and integrate seamlessly with the existing single-page static site.

## Technical Context

**Language/Version**: Vanilla HTML5, CSS3, ES6+ JavaScript + 11ty (Eleventy) v3.x  
**Primary Dependencies**: 
- `@11ty/eleventy` - Static site generator
- `@11ty/eleventy-plugin-syntaxhighlight` - Code syntax highlighting
- `markdown-it` - Markdown parser (included with 11ty)
- `serve` - Dev server (existing)

**Storage**: Static files - source Markdown in `posts/`, compiled HTML in `public/blog/`  
**Testing**: Manual testing only (no automated test framework per Constitution)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Static website with minimal build process for Markdown compilation  
**Performance Goals**: <2s page load on 3G, <100KB per blog page, <30s build for 50 posts  
**Constraints**: Generated output must be pure static HTML/CSS/JS, GitHub Pages compatible, WCAG AA accessibility  
**Scale/Scope**: Personal blog with ~10-50 posts, retro dungeon aesthetic, mobile-first responsive design

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Simplicity First

- [x] **VIOLATION**: Does this feature introduce any build process, bundlers, transpilers, or compilation steps?
  - **YES** - Requires 11ty build process to compile Markdown to HTML
- [x] **PASS**: Does this feature require any frontend frameworks (React, Vue, etc.)?
  - **NO** - Generated output is pure HTML/CSS/JS
- [x] **PASS**: Are all dependencies limited to development/build time only?
  - **YES** - 11ty runs at build time, not runtime
- [x] **PASS**: Is all code directly runnable in browser without transformation?
  - **YES** - Generated HTML/CSS/JS runs directly in browser

### Principle II: Static-First Architecture

- [x] **PASS**: Does this feature require server-side rendering, APIs, or dynamic backends?
  - **NO** - 11ty generates static HTML files
- [x] **PASS**: Are all files served directly from `public/` directory?
  - **YES** - Generated blog HTML goes to `public/blog/`
- [x] **PASS**: Can content updates be made via direct file edits only?
  - **YES** - Edit Markdown files, run build, commit generated HTML

### Principle III: Aesthetic Consistency

- [x] **PASS**: Does this feature maintain the retro 90s/Daggerfall dungeon aesthetic?
  - **YES** - Custom 11ty templates will use Win95/dungeon styling
- [x] **PASS**: Are Win95-style UI elements preserved?
  - **YES** - Blog navigation integrates with existing Win95 menu bar
- [x] **PASS**: Do new visual elements match existing pixel art/retro style?
  - **YES** - Blog templates will use existing CSS variables and aesthetic
- [x] **PASS**: Are existing animations (torch, sprites) preserved/enhanced?
  - **YES** - Blog pages can include dungeon decorations (torches, tiles)

### Principle IV: Accessibility Standards

- [x] **PASS**: Are all interactive elements keyboard accessible (Tab, Enter, Esc)?
  - **YES** - Blog navigation uses standard HTML links
- [x] **PASS**: Do modal dialogs trap focus and dismiss via Esc?
  - **N/A** - Blog uses page navigation, not modals
- [x] **PASS**: Do images have descriptive alt text?
  - **YES** - Markdown image syntax supports alt text
- [x] **PASS**: Is semantic HTML used (nav, main, section, article)?
  - **YES** - 11ty templates will use semantic `<article>`, `<nav>`, etc.
- [x] **PASS**: Does color contrast meet WCAG AA standards minimum?
  - **YES** - Existing Win95 color palette meets WCAG AA
- [x] **PASS**: Do animations respect prefers-reduced-motion media query?
  - **YES** - Existing CSS already handles this

### Principle V: Deployment Automation

- [x] **PASS**: Does deployment remain fully automated via GitHub Actions?
  - **YES** - Add build step to workflow, otherwise unchanged
- [x] **PASS**: Are there zero manual deployment steps required?
  - **YES** - Push to `main` → GitHub Actions builds + deploys
- [x] **PASS**: Will changes work with existing `.github/workflows/deploy.yml`?
  - **YES** - Add `npm run build` step before deploy

### Violations Justification

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Build process** (Principle I) | Markdown compilation requires transforming `.md` → `.html` at build time | Writing blog posts directly in HTML is unmaintainable and defeats purpose of Markdown authoring workflow |

**Proposed Constitution Amendment**: Allow minimal build process for content transformation (Markdown → HTML) while maintaining that deployed output remains pure static HTML/CSS/JS with no runtime dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/001-001-static-blog-system/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file - implementation plan
├── checklists/
│   └── requirements.md  # Validation checklist (COMPLETE)
└── tasks.md             # Task breakdown (NEXT)
```

### Source Code (repository root)

```text
# Root configuration
.eleventy.js             # 11ty configuration file (NEW)
package.json             # Add 11ty dependencies + build scripts (MODIFIED)

# Blog source files (NEW)
posts/                   # Markdown source files
├── 2025-01-07-welcome-to-my-blog.md
├── 2025-01-15-setting-up-eleventy.md
└── ...

# 11ty templates (NEW)
_includes/
├── layouts/
│   ├── base.njk         # Base HTML template (header, footer)
│   ├── blog-post.njk    # Individual blog post layout
│   └── blog-index.njk   # Blog listing page layout
└── components/
    ├── blog-nav.njk     # Blog navigation component
    └── post-card.njk    # Post preview card for index

# Generated blog HTML (OUTPUT)
public/
├── index.html           # Main site (MODIFIED - add blog link to Win95 menu)
├── blog/                # Generated blog files (NEW - gitignored or committed)
│   ├── index.html       # Blog listing page (generated from posts/)
│   └── posts/           # Individual post pages
│       ├── welcome-to-my-blog.html
│       ├── setting-up-eleventy.html
│       └── ...
├── assets/
│   ├── css/
│   │   ├── style.css    # Main site styles (MODIFIED - add blog-specific styles)
│   │   └── prism-retro.css  # Syntax highlighting theme (NEW)
│   ├── img/             # Existing images + blog post images
│   └── fonts/           # Existing fonts (JetBrains Mono already available)
└── CNAME                # Unchanged

# Deployment
.github/
└── workflows/
    └── deploy.yml       # Add `npm run build` step (MODIFIED)

# Gitignore
.gitignore               # Add `public/blog/` if building in CI (MODIFIED)
```

**Structure Decision**: 
- **Source Markdown**: `posts/*.md` - Human-authored blog content
- **Templates**: `_includes/layouts/` - 11ty Nunjucks templates for blog pages
- **Generated Output**: `public/blog/` - Static HTML generated by 11ty
- **Styling**: Extend `public/assets/css/style.css` with blog-specific classes
- **Integration**: Add "Blog" link to Win95 menu bar in `public/index.html`

**Build vs Commit Decision**: 
- **Option A (Recommended)**: Gitignore `public/blog/`, build in GitHub Actions CI before deploy
- **Option B**: Commit generated `public/blog/` HTML files to repo (simpler but larger git history)
- **Decision**: Option A - keeps repo clean, leverages CI/CD

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Build process (11ty)** | Markdown → HTML compilation cannot happen purely in browser | Client-side Markdown rendering would require JavaScript for core content (violates static-first principle), hurt SEO, and slow initial page load |
| **New directory structure** (`posts/`, `_includes/`) | 11ty convention for source files vs output | Mixing source `.md` and generated `.html` in same directory would be confusing and error-prone |

## Implementation Phases

### Phase 0: Setup & Configuration (Foundation)

**Goal**: Install 11ty, configure build process, set up project structure

**Tasks**:
1. Install 11ty and plugins (`@11ty/eleventy`, `@11ty/eleventy-plugin-syntaxhighlight`)
2. Create `.eleventy.js` configuration file
3. Configure input (`posts/`) and output (`public/blog/`) directories
4. Add `build:blog` script to `package.json`
5. Create directory structure (`posts/`, `_includes/layouts/`, `_includes/components/`)
6. Test build process with empty config

**Validation**: Running `npm run build:blog` creates `public/blog/` directory (even if empty)

---

### Phase 1: Base Templates & Styling (Foundation)

**Goal**: Create 11ty templates matching Win95/dungeon aesthetic

**Tasks**:
1. Create `_includes/layouts/base.njk` - HTML shell with Win95 styling
2. Create `_includes/layouts/blog-post.njk` - Individual post layout
3. Create `_includes/layouts/blog-index.njk` - Blog listing layout
4. Add blog-specific CSS to `public/assets/css/style.css`:
   - `.blog-container` - Main content area
   - `.blog-post` - Article styling
   - `.blog-index` - Listing page styles
   - `.post-card` - Preview card on index
   - Typography classes for JetBrains Mono
5. Configure syntax highlighting plugin with retro theme
6. Create `public/assets/css/prism-retro.css` - Custom code highlighting theme

**Validation**: Templates compile without errors, CSS classes defined

---

### Phase 2: User Story 1 - Core Blog Reading (P1) 🎯 MVP

**Goal**: Visitors can read blog posts in a clean, readable format

**Tasks**:
1. Create 2-3 example blog posts in `posts/` with frontmatter (title, date, excerpt)
2. Configure 11ty to process Markdown posts
3. Test post compilation - verify HTML generation
4. Style blog post pages with JetBrains Mono, proper spacing, Win95 aesthetic
5. Add dungeon decorations (torches, tiles) to blog pages
6. Test mobile responsiveness on post pages
7. Add "Back to Blog" and "Home" navigation links to posts

**Validation**: 
- Blog posts render correctly at `/blog/posts/post-title.html`
- Content readable, properly formatted, mobile-responsive
- Navigation links work

---

### Phase 3: User Story 2 - Content Authoring (P1)

**Goal**: Content author can write posts in Markdown easily

**Tasks**:
1. Document Markdown frontmatter format (title, date, excerpt, tags)
2. Test all Markdown features: headings, lists, links, images, code blocks
3. Configure external links to open in new tabs
4. Configure images to be responsive
5. Test syntax highlighting on code blocks
6. Create "Writing a Blog Post" guide in README

**Validation**: 
- Markdown compiles correctly to HTML
- All Markdown features work
- Code blocks have syntax highlighting
- Images responsive

---

### Phase 4: User Story 3 - Blog Discovery (P2)

**Goal**: Visitors can see list of all posts with dates and excerpts

**Tasks**:
1. Create blog index page at `/blog/index.html`
2. Configure 11ty collections to sort posts by date (newest first)
3. Display post list with title, date, excerpt
4. Create `.post-card` component for preview cards
5. Add pagination if needed (if >20 posts)
6. Style index page with Win95/dungeon aesthetic
7. Test mobile responsiveness on index page

**Validation**:
- Blog index shows all posts in reverse chronological order
- Preview cards display correctly
- Mobile-responsive

---

### Phase 5: User Story 4 - Navigation Integration (P2)

**Goal**: Visitors can access blog from main site navigation

**Tasks**:
1. Add "Blog" link to Win95 menu bar in `public/index.html`
2. Ensure blog link matches existing menu item styling
3. Test navigation flow: Home → Blog Index → Post → Back to Blog → Home
4. Add breadcrumb navigation if appropriate
5. Ensure keyboard navigation works (Tab through links)

**Validation**:
- "Blog" link visible in main site menu
- Navigation flows work correctly
- Keyboard accessible

---

### Phase 6: User Story 5 - Mobile Experience (P3)

**Goal**: Mobile users can read blog posts with proper formatting

**Tasks**:
1. Test blog index on mobile devices (iOS Safari, Android Chrome)
2. Test blog post pages on mobile devices
3. Verify text readable without horizontal scrolling
4. Verify touch targets meet 44x44px minimum
5. Test images scale appropriately
6. Adjust spacing/typography for mobile if needed
7. Test navigation on mobile (tap targets)

**Validation**:
- Blog fully functional on mobile devices
- Text readable, no horizontal scroll
- Touch targets accessible

---

### Phase 7: Metadata & SEO (Polish)

**Goal**: Blog pages have proper meta tags and SEO optimization

**Tasks**:
1. Add meta tags to blog post template (title, description, og:tags)
2. Add meta tags to blog index template
3. Configure 11ty to generate meta from frontmatter
4. Test meta tags render correctly (view page source)
5. Add canonical URLs if needed

**Validation**: Meta tags present in generated HTML

---

### Phase 8: Build Integration & Deployment (Critical)

**Goal**: Blog builds and deploys automatically via GitHub Actions

**Tasks**:
1. Update `.github/workflows/deploy.yml` to run `npm run build:blog` before deploy
2. Decide: gitignore `public/blog/` and build in CI, or commit generated files
3. Test deployment workflow on feature branch
4. Verify blog pages accessible on GitHub Pages after deploy
5. Test full workflow: write post → commit → push → auto-build → deploy

**Validation**:
- Blog builds automatically in CI
- Deployed site includes blog pages
- GitHub Pages serves blog correctly

---

### Phase 9: Edge Cases & Error Handling (Polish)

**Goal**: Handle edge cases gracefully

**Tasks**:
1. Test empty blog state (0 posts) - show placeholder message
2. Test very long post titles - truncate or wrap on index
3. Add image optimization guidance for authors
4. Handle missing frontmatter - provide defaults
5. Test special characters in post titles/URLs
6. Add draft post mechanism (exclude from build)
7. Test post modification dates
8. Cross-browser testing (Chrome, Firefox, Safari, Edge)

**Validation**: All edge cases handled gracefully

---

### Phase 10: Documentation & Cleanup (Final)

**Goal**: Project documented, code clean

**Tasks**:
1. Update README.md with blog usage instructions
2. Document how to write a blog post
3. Document build process
4. Document deployment process
5. Clean up unused CSS
6. Remove console.logs or debug code
7. Run accessibility audit (axe DevTools)
8. Performance audit (Lighthouse)
9. Complete requirements validation checklist

**Validation**: All documentation complete, code clean, checklist complete

---

## Technical Decisions

### 11ty Configuration

**.eleventy.js**:
```js
module.exports = function(eleventyConfig) {
  // Input: posts/, Output: public/blog/
  eleventyConfig.setInputDirectory("posts");
  eleventyConfig.setOutputDirectory("public/blog");
  
  // Copy assets
  eleventyConfig.addPassthroughCopy("public/assets");
  
  // Syntax highlighting plugin
  const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
  eleventyConfig.addPlugin(syntaxHighlight);
  
  // Collections: sort posts by date
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("posts/*.md").sort((a, b) => {
      return b.date - a.date; // Newest first
    });
  });
  
  // Open external links in new tab
  const markdownIt = require("markdown-it");
  const markdownItAttrs = require("markdown-it-attrs");
  const md = markdownIt({ html: true }).use(markdownItAttrs);
  eleventyConfig.setLibrary("md", md);
  
  return {
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk"
  };
};
```

### Frontmatter Format

**posts/2025-01-07-example-post.md**:
```markdown
---
title: "My First Blog Post"
date: 2025-01-07
excerpt: "A short description of this post for the blog index"
tags: ["web-dev", "eleventy", "blogging"]
layout: layouts/blog-post.njk
---

# My First Blog Post

Content goes here with **Markdown** formatting.

\`\`\`javascript
console.log("Code blocks with syntax highlighting!");
\`\`\`
```

### URL Structure

- **Blog Index**: `/blog/index.html` → `https://yourdomain.com/blog/`
- **Blog Posts**: `/blog/posts/post-title.html` → `https://yourdomain.com/blog/posts/post-title/`
- **Flat structure**: No date-based hierarchy

### Build Scripts (package.json)

```json
{
  "scripts": {
    "start": "serve public -p 3000",
    "build:blog": "eleventy",
    "build": "npm run build:blog",
    "clean": "rm -rf public/blog"
  }
}
```

### Deployment Strategy

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
- name: Install dependencies
  run: npm ci
  
- name: Build blog
  run: npm run build:blog
  
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./public
```

## Dependencies

### New NPM Packages

```json
{
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0",
    "@11ty/eleventy-plugin-syntaxhighlight": "^5.0.0",
    "markdown-it": "^14.0.0",
    "markdown-it-attrs": "^4.1.0"
  }
}
```

### File Dependencies

**Blocked by**: None (can start immediately)

**Blocks**:
- User Story 2 depends on Phase 0 + Phase 1 (templates)
- User Story 3 depends on Phase 0 + Phase 1 (templates)
- User Story 4 depends on User Stories 1-3 (content exists to navigate to)
- Phase 8 (Deployment) depends on all user stories being testable

## Success Criteria (from spec.md)

1. ✅ Authors can write blog posts in Markdown files
2. ✅ Running build command generates static HTML blog pages
3. ✅ Blog index page displays all posts with dates and excerpts
4. ✅ Individual blog post pages render content correctly
5. ✅ Navigation between main site, blog index, and posts works seamlessly
6. ✅ Blog pages are mobile-responsive and readable on phones
7. ✅ Code blocks in posts have syntax highlighting
8. ✅ Site can be deployed to GitHub Pages without changes to deployment workflow

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **11ty learning curve** | Delays implementation | Use official docs, simple templates first, iterate |
| **Build time exceeds 30s** | Slow developer experience | Profile build, optimize templates, use 11ty's incremental builds |
| **Syntax highlighting theme doesn't match aesthetic** | Visual inconsistency | Create custom Prism theme with Win95/terminal colors |
| **Mobile layout breaks on small screens** | Poor UX on mobile | Test early and often on real devices (iOS/Android) |
| **GitHub Actions build fails** | Deployment blocked | Test workflow on feature branch before merging to main |
| **Generated HTML too large** | Performance issues | Minimize template HTML, optimize images, paginate index |

## Next Steps

1. ✅ **User answered open questions** (11ty, flat URLs, no migration)
2. ⬜ **Update constitution** to allow minimal build process
3. ⬜ **Create tasks.md** with detailed task breakdown
4. ⬜ **Begin Phase 0** (Setup & Configuration)
5. ⬜ **Implement MVP** (Phases 0-2: Blog reading functionality)
6. ⬜ **Iterate through remaining phases**
7. ⬜ **Complete requirements validation checklist**
8. ⬜ **Deploy and validate** on GitHub Pages

---

**Ready to proceed to task breakdown!**
