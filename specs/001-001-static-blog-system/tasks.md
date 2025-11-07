# Tasks: Static Blog System

**Input**: Design documents from `/specs/001-001-static-blog-system/`
**Prerequisites**: plan.md (complete), spec.md (complete), checklists/requirements.md (complete)

**Testing**: This project uses MANUAL TESTING ONLY per Constitution Principle I (Simplicity First). No automated test infrastructure exists. Each task includes manual verification steps.

**Organization**: Tasks are grouped by implementation phase and mapped to user stories (US1-US5) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Static website**: All files in `public/` at repository root
  - HTML: `public/index.html`
  - CSS: `public/assets/css/style.css`
  - Images: `public/assets/img/`
  - Fonts: `public/assets/fonts/`
- **Blog source**: `posts/` directory (Markdown files)
- **Blog templates**: `_includes/layouts/` directory (Nunjucks templates)
- **Generated blog output**: `public/blog/` (gitignored, built in CI)

---

## Phase 0: Setup & Configuration (Foundation)

**Purpose**: Install 11ty, configure build process, set up project structure

**⚠️ CRITICAL**: This phase must be complete before ANY user story work can begin

### Tasks

- [ ] T001 [P] Install 11ty and dependencies via `npm install --save-dev @11ty/eleventy @11ty/eleventy-plugin-syntaxhighlight markdown-it markdown-it-attrs`
- [ ] T002 Create `.eleventy.js` configuration file at repository root
- [ ] T003 Configure input directory as `posts/` and output directory as `public/blog/` in `.eleventy.js`
- [ ] T004 Add syntax highlighting plugin to `.eleventy.js`
- [ ] T005 Configure Markdown-it library with attrs plugin in `.eleventy.js`
- [ ] T006 Add posts collection sorted by date (newest first) in `.eleventy.js`
- [ ] T007 [P] Add `"build:blog": "eleventy"` script to `package.json`
- [ ] T008 [P] Add `"build": "npm run build:blog"` script to `package.json`
- [ ] T009 [P] Add `"clean": "rm -rf public/blog"` script to `package.json`
- [ ] T010 Create `posts/` directory at repository root
- [ ] T011 Create `_includes/` directory at repository root
- [ ] T012 Create `_includes/layouts/` directory for templates
- [ ] T013 Create `_includes/components/` directory for reusable components
- [ ] T014 Update `.gitignore` to add `public/blog/` (will be built in CI)

### Manual Verification Checklist

- [ ] Running `npm run build:blog` executes without errors (even if no content yet)
- [ ] `public/blog/` directory is created after build
- [ ] `.eleventy.js` file is valid JavaScript (no syntax errors)
- [ ] Directory structure matches plan.md specification
- [ ] Dependencies installed successfully (check `node_modules/`)

**Checkpoint**: Foundation ready - template creation can now begin

---

## Phase 1: Base Templates & Styling (Foundation)

**Purpose**: Create 11ty templates matching Win95/dungeon aesthetic

**⚠️ CRITICAL**: This phase must be complete before ANY user story content can be created

### Tasks

- [ ] T015 [P] Create `_includes/layouts/base.njk` with HTML shell (<!DOCTYPE>, <html>, <head>, <body>)
- [ ] T016 [P] Add Win95-style meta tags to `base.njk` (viewport, charset, description)
- [ ] T017 [P] Link existing CSS `public/assets/css/style.css` in `base.njk` <head>
- [ ] T018 [P] Add JetBrains Mono font reference to `base.njk` (or verify already in main CSS)
- [ ] T019 Create `_includes/layouts/blog-post.njk` extending `base.njk` for individual posts
- [ ] T020 Add frontmatter variables to `blog-post.njk` template (title, date, content)
- [ ] T021 Add "Back to Blog" and "Home" navigation links to `blog-post.njk`
- [ ] T022 Create `_includes/layouts/blog-index.njk` extending `base.njk` for listing page
- [ ] T023 Add posts loop to `blog-index.njk` to display all posts from collection
- [ ] T024 Create `_includes/components/post-card.njk` for post preview cards
- [ ] T025 [P] Add blog-specific CSS classes to `public/assets/css/style.css`:
  - `.blog-container` - Main content wrapper
  - `.blog-post` - Article styling
  - `.blog-post h1, h2, h3` - Heading styles
  - `.blog-post p` - Paragraph spacing
  - `.blog-post ul, ol` - List styling
  - `.blog-post code` - Inline code styling
  - `.blog-post pre` - Code block container
  - `.blog-index` - Listing page styles
  - `.post-card` - Preview card component
  - `.post-meta` - Date/metadata display
- [ ] T026 [P] Create `public/assets/css/prism-retro.css` for syntax highlighting theme
- [ ] T027 Configure Prism theme colors to match Win95/terminal aesthetic (greens, ambers, monochrome)
- [ ] T028 Add dungeon decoration elements to blog templates (torches, tiles) matching main site
- [ ] T029 Test template compilation with empty content (`npm run build:blog`)

### Manual Verification Checklist

- [ ] Templates compile without errors
- [ ] Generated HTML has proper DOCTYPE and semantic structure
- [ ] CSS classes are defined and not causing conflicts with main site styles
- [ ] Syntax highlighting theme has retro aesthetic
- [ ] No console errors when viewing generated pages
- [ ] Templates extend base.njk correctly (check inheritance)

**Checkpoint**: Templates ready - user story content creation can now begin in parallel

---

## Phase 2: User Story 1 - Core Blog Reading (Priority: P1) 🎯 MVP

**Goal**: Visitors can read blog posts in a clean, readable format

**Manual Verification**: How to manually test this story independently
- [ ] Navigate to `/blog/posts/welcome-to-my-blog.html` in browser
- [ ] Verify post title, date, and content render correctly
- [ ] Test "Back to Blog" and "Home" links navigate correctly
- [ ] Check text is readable (contrast, font size, line height)
- [ ] Test on mobile device (responsive layout)
- [ ] Verify keyboard navigation (Tab through links)
- [ ] Check screen reader announces article and navigation correctly
- [ ] Confirm no console errors in browser DevTools

### Implementation for User Story 1

- [ ] T030 [US1] Create example post `posts/welcome-to-my-blog.md` with frontmatter (title, date, excerpt, layout)
- [ ] T031 [US1] Add Markdown content to `welcome-to-my-blog.md` including headings, paragraphs, lists
- [ ] T032 [US1] Create second example post `posts/setting-up-eleventy.md` to test multiple posts
- [ ] T033 [US1] Run build command `npm run build:blog` and verify HTML generation
- [ ] T034 [US1] Test local preview with `yarn start` and navigate to generated blog pages
- [ ] T035 [US1] Style blog post heading typography in `public/assets/css/style.css`
- [ ] T036 [US1] Style blog post paragraph spacing for readability (line-height, margins)
- [ ] T037 [US1] Add responsive breakpoints for blog content (mobile: 375px, tablet: 768px, desktop: 1440px)
- [ ] T038 [US1] Test mobile layout on real device or browser DevTools responsive mode
- [ ] T039 [US1] Add ARIA landmarks to `blog-post.njk` (<article>, <nav>, role="main")
- [ ] T040 [US1] Verify semantic HTML structure (h1 for title, time for date, article for content)
- [ ] T041 [US1] Add dungeon decorations to blog post template (torch GIFs, tile backgrounds)
- [ ] T042 [US1] Test "Back to Blog" link navigates to `/blog/index.html`
- [ ] T043 [US1] Test "Home" link navigates to `/` (main site)
- [ ] T044 [US1] Verify Win95 aesthetic consistency (colors match CSS variables `--win95-*`)

### Manual Testing Checklist (complete before marking story done)

- [ ] Blog post pages load at correct URLs (`/blog/posts/*.html`)
- [ ] Post title displays as h1 heading
- [ ] Post date displays in readable format
- [ ] Post content renders Markdown correctly (headings, paragraphs, lists)
- [ ] "Back to Blog" link works and navigates to blog index
- [ ] "Home" link works and navigates to main site
- [ ] Layout is responsive on mobile (375px width)
- [ ] Layout is responsive on tablet (768px width)
- [ ] Layout is responsive on desktop (1440px width)
- [ ] Text is readable without horizontal scrolling on mobile
- [ ] Keyboard navigation works (Tab through links, Enter to activate)
- [ ] Screen reader announces "article" and navigation landmarks
- [ ] No console errors in browser DevTools
- [ ] Dungeon decorations (torches, tiles) display correctly
- [ ] Colors and fonts match Win95/dungeon aesthetic
- [ ] Page loads in under 2 seconds (check Network tab)

**Checkpoint**: At this point, User Story 1 should be fully functional and manually verified

---

## Phase 3: User Story 2 - Content Authoring (Priority: P1)

**Goal**: Content author can write posts in Markdown easily

**Manual Verification**: How to manually test this story independently
- [ ] Create a new test post with all Markdown features (headings, lists, links, images, code)
- [ ] Run build and verify all Markdown features compile correctly
- [ ] Test external links open in new tabs
- [ ] Test images are responsive
- [ ] Test code blocks have syntax highlighting
- [ ] Verify Markdown authoring is straightforward (no HTML needed)

### Implementation for User Story 2

- [ ] T045 [US2] Document Markdown frontmatter format in README.md (title, date, excerpt, tags, layout)
- [ ] T046 [US2] Create example post testing all Markdown features: `posts/markdown-test.md`
- [ ] T047 [US2] Test headings (h1-h6) compile correctly
- [ ] T048 [US2] Test lists (ordered, unordered, nested) compile correctly
- [ ] T049 [US2] Test links (internal, external) compile correctly
- [ ] T050 [US2] Test images compile correctly and are responsive
- [ ] T051 [US2] Test code blocks (inline `code` and fenced ```code```) compile correctly
- [ ] T052 [US2] Configure external links to open in new tabs (target="_blank" rel="noopener")
- [ ] T053 [US2] Configure images to be responsive (max-width: 100%, height: auto)
- [ ] T054 [US2] Add image wrapper styles to `public/assets/css/style.css` for centering
- [ ] T055 [US2] Test syntax highlighting on code blocks with multiple languages (js, python, html, css)
- [ ] T056 [US2] Verify syntax highlighting colors match retro theme
- [ ] T057 [US2] Test blockquotes if supported
- [ ] T058 [US2] Test horizontal rules if supported
- [ ] T059 [US2] Document "Writing a Blog Post" guide in README.md with examples
- [ ] T060 [US2] Include frontmatter template in README.md for copy-paste

### Manual Testing Checklist

- [ ] All Markdown headings (h1-h6) render correctly
- [ ] Ordered and unordered lists render correctly
- [ ] Nested lists render correctly
- [ ] Internal links navigate correctly
- [ ] External links open in new tabs (verify target="_blank" in page source)
- [ ] External links have rel="noopener" for security
- [ ] Images display correctly
- [ ] Images are responsive (shrink on mobile, don't overflow)
- [ ] Inline code has monospace font and background
- [ ] Fenced code blocks have syntax highlighting
- [ ] Code block colors match retro theme (check CSS)
- [ ] Multiple languages (JavaScript, Python, HTML, CSS) highlight correctly
- [ ] Blockquotes styled appropriately (if used)
- [ ] Horizontal rules styled appropriately (if used)
- [ ] README.md has clear instructions for writing posts
- [ ] Frontmatter template is copy-paste ready

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 4: User Story 3 - Blog Discovery (Priority: P2)

**Goal**: Visitors can see list of all posts with dates and excerpts

**Manual Verification**: How to manually test this story independently
- [ ] Navigate to `/blog/` or `/blog/index.html` in browser
- [ ] Verify all posts display in reverse chronological order (newest first)
- [ ] Verify each post preview shows title, date, and excerpt
- [ ] Click on post title/link and verify navigation to full post
- [ ] Test on mobile device (responsive layout)
- [ ] Verify keyboard navigation through post list

### Implementation for User Story 3

- [ ] T061 [P] [US3] Create blog index template content in `_includes/layouts/blog-index.njk`
- [ ] T062 [US3] Configure 11ty to generate `/blog/index.html` from blog-index template
- [ ] T063 [US3] Add posts collection loop to blog-index template (iterate over posts sorted by date)
- [ ] T064 [US3] Include post-card component in loop for each post
- [ ] T065 [P] [US3] Create `.post-card` styles in `public/assets/css/style.css`
- [ ] T066 [P] [US3] Create `.post-meta` styles for date display
- [ ] T067 [US3] Format post dates in human-readable format (e.g., "January 7, 2025")
- [ ] T068 [US3] Display post excerpts from frontmatter (truncate if too long)
- [ ] T069 [US3] Add links from post titles to individual post pages
- [ ] T070 [US3] Test posts display in reverse chronological order (newest first)
- [ ] T071 [US3] Style blog index page with Win95/dungeon aesthetic
- [ ] T072 [US3] Add dungeon decorations to blog index (torches, tiles)
- [ ] T073 [US3] Test mobile responsive layout for blog index
- [ ] T074 [US3] Add pagination if needed (if >20 posts) - OPTIONAL for MVP
- [ ] T075 [US3] Verify keyboard navigation through post links (Tab, Enter)
- [ ] T076 [US3] Add ARIA labels to blog index navigation elements

### Manual Testing Checklist

- [ ] Blog index loads at `/blog/` or `/blog/index.html`
- [ ] All posts display on index page
- [ ] Posts are in reverse chronological order (newest at top)
- [ ] Each post preview shows title
- [ ] Each post preview shows formatted date (human-readable)
- [ ] Each post preview shows excerpt
- [ ] Clicking post title navigates to full post page
- [ ] Post card styling matches Win95/dungeon aesthetic
- [ ] Layout is responsive on mobile (cards stack vertically)
- [ ] Layout is responsive on tablet
- [ ] Layout is responsive on desktop
- [ ] No horizontal scrolling on mobile
- [ ] Keyboard navigation works (Tab through post links, Enter to open)
- [ ] Screen reader announces post count and list structure
- [ ] No console errors in browser DevTools
- [ ] Pagination works if implemented (OPTIONAL)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 5: User Story 4 - Navigation Integration (Priority: P2)

**Goal**: Visitors can access blog from main site navigation

**Manual Verification**: How to manually test this story independently
- [ ] Load main site homepage (`/`)
- [ ] Verify "Blog" link is visible in Win95 menu bar
- [ ] Click "Blog" link and verify navigation to `/blog/`
- [ ] Test navigation flow: Home → Blog Index → Post → Back to Blog → Home
- [ ] Verify keyboard navigation through menu (Tab to Blog link, Enter to activate)
- [ ] Test on mobile that menu is accessible

### Implementation for User Story 4

- [ ] T077 [US4] Open `public/index.html` and locate Win95 menu bar navigation
- [ ] T078 [US4] Add "Blog" link to menu bar in `public/index.html`
- [ ] T079 [US4] Set "Blog" link href to `/blog/` or `/blog/index.html`
- [ ] T080 [US4] Style "Blog" link to match existing menu items (same font, colors, hover effects)
- [ ] T081 [US4] Verify "Blog" link has proper Win95 button styling
- [ ] T082 [US4] Test navigation flow: click Home → click Blog → verify blog index loads
- [ ] T083 [US4] Test navigation flow: Blog Index → click post → verify post loads
- [ ] T084 [US4] Test navigation flow: Post → click "Back to Blog" → verify blog index loads
- [ ] T085 [US4] Test navigation flow: Post → click "Home" → verify main site loads
- [ ] T086 [US4] Add breadcrumb navigation if appropriate (OPTIONAL)
- [ ] T087 [US4] Verify keyboard navigation: Tab to "Blog" link, Enter to activate
- [ ] T088 [US4] Test on mobile: verify menu accessible and "Blog" link tappable

### Manual Testing Checklist

- [ ] "Blog" link visible in main site Win95 menu bar
- [ ] "Blog" link styling matches other menu items
- [ ] "Blog" link has Win95 button hover effects
- [ ] Clicking "Blog" link navigates to `/blog/`
- [ ] Navigation flow works: Home → Blog → Post → Back to Blog → Home
- [ ] All navigation links work correctly (no 404s)
- [ ] Keyboard navigation works (Tab through menu, Enter to activate)
- [ ] Mobile menu accessible (if menu is responsive)
- [ ] "Blog" link has appropriate touch target size on mobile (44x44px minimum)
- [ ] No console errors during navigation
- [ ] Browser back button works correctly throughout navigation flow
- [ ] Breadcrumbs work if implemented (OPTIONAL)

**Checkpoint**: At this point, all core user stories (US1-US4) should work together seamlessly

---

## Phase 6: User Story 5 - Mobile Experience (Priority: P3)

**Goal**: Mobile users can read blog posts with proper formatting

**Manual Verification**: How to manually test this story independently
- [ ] Test on real iOS device (iPhone Safari)
- [ ] Test on real Android device (Chrome)
- [ ] Test on browser DevTools responsive mode (375px, 768px, 1024px widths)
- [ ] Verify text readable without zooming
- [ ] Verify no horizontal scrolling
- [ ] Verify touch targets large enough (44x44px minimum)
- [ ] Verify images scale appropriately

### Implementation for User Story 5

- [ ] T089 [US5] Test blog index on iOS Safari (real device or simulator)
- [ ] T090 [US5] Test blog index on Android Chrome (real device or emulator)
- [ ] T091 [US5] Test blog post pages on iOS Safari
- [ ] T092 [US5] Test blog post pages on Android Chrome
- [ ] T093 [US5] Verify text readable at 375px width (iPhone SE size)
- [ ] T094 [US5] Verify text readable at 768px width (iPad portrait)
- [ ] T095 [US5] Verify no horizontal scrolling at any breakpoint
- [ ] T096 [US5] Test touch targets: "Blog" link, post links, "Back to Blog", "Home" (44x44px minimum)
- [ ] T097 [US5] Test images scale appropriately on mobile (no overflow)
- [ ] T098 [US5] Test code blocks on mobile (horizontal scroll if needed, or wrap)
- [ ] T099 [US5] Adjust spacing/margins for mobile if needed (reduce padding)
- [ ] T100 [US5] Adjust typography for mobile if needed (font sizes, line heights)
- [ ] T101 [US5] Test dungeon decorations on mobile (ensure they don't break layout)
- [ ] T102 [US5] Verify navigation menu works on mobile (if responsive)
- [ ] T103 [US5] Test pinch-to-zoom works correctly (not disabled)

### Manual Testing Checklist

- [ ] Blog index fully functional on iOS Safari
- [ ] Blog index fully functional on Android Chrome
- [ ] Blog post pages fully functional on iOS Safari
- [ ] Blog post pages fully functional on Android Chrome
- [ ] Text readable at 375px width (mobile phone)
- [ ] Text readable at 768px width (tablet portrait)
- [ ] Text readable at 1024px width (tablet landscape)
- [ ] No horizontal scrolling at any breakpoint
- [ ] All touch targets meet 44x44px minimum (verify with browser DevTools)
- [ ] Images scale properly (don't overflow, maintain aspect ratio)
- [ ] Code blocks readable on mobile (horizontal scroll or wrap appropriately)
- [ ] Layout doesn't break on mobile (no overlapping elements)
- [ ] Spacing/margins appropriate for mobile (not too cramped)
- [ ] Font sizes readable on mobile (not too small)
- [ ] Dungeon decorations visible and don't break layout
- [ ] Navigation menu accessible on mobile
- [ ] Pinch-to-zoom works (not disabled by viewport meta tag)

**Checkpoint**: All user stories should now work independently and on all devices

---

## Phase 7: Metadata & SEO (Polish)

**Purpose**: Blog pages have proper meta tags and SEO optimization

### Tasks

- [ ] T104 [P] Add `<title>` tag to `blog-post.njk` using frontmatter title
- [ ] T105 [P] Add `<meta name="description">` tag to `blog-post.njk` using frontmatter excerpt
- [ ] T106 [P] Add Open Graph tags to `blog-post.njk` (og:title, og:description, og:type, og:url)
- [ ] T107 [P] Add Twitter Card tags to `blog-post.njk` (twitter:card, twitter:title, twitter:description)
- [ ] T108 [P] Add `<title>` tag to `blog-index.njk`
- [ ] T109 [P] Add `<meta name="description">` tag to `blog-index.njk`
- [ ] T110 Configure 11ty to generate meta tags from frontmatter automatically
- [ ] T111 Test meta tags render correctly in page source (view source in browser)
- [ ] T112 Add canonical URLs if needed (OPTIONAL)
- [ ] T113 Test meta tags with social media link preview tools (Facebook debugger, Twitter validator)

### Manual Verification Checklist

- [ ] Blog post pages have unique `<title>` tags (check page source)
- [ ] Blog post pages have `<meta name="description">` tags
- [ ] Blog index has `<title>` tag
- [ ] Blog index has `<meta name="description">` tag
- [ ] Open Graph tags present in page source
- [ ] Twitter Card tags present in page source
- [ ] Meta descriptions are descriptive and accurate
- [ ] Social media link previews work (test with preview tools)
- [ ] Canonical URLs set correctly if implemented

**Checkpoint**: SEO and social sharing optimized

---

## Phase 8: Build Integration & Deployment (Critical)

**Purpose**: Blog builds and deploys automatically via GitHub Actions

**⚠️ CRITICAL**: This phase must be complete before blog can go live

### Tasks

- [ ] T114 Open `.github/workflows/deploy.yml` file
- [ ] T115 Add `npm ci` step before deployment (install dependencies)
- [ ] T116 Add `npm run build:blog` step after install, before deploy
- [ ] T117 Verify workflow YAML syntax is valid
- [ ] T118 Commit workflow changes to feature branch
- [ ] T119 Test deployment workflow on feature branch (push to test branch)
- [ ] T120 Verify blog pages build successfully in GitHub Actions logs
- [ ] T121 Verify blog pages deploy to GitHub Pages
- [ ] T122 Test blog pages accessible on deployed URL (e.g., username.github.io/blog/)
- [ ] T123 Test full workflow: write new post → commit → push → auto-build → deploy
- [ ] T124 Verify `public/blog/` is gitignored (not committed to repo)
- [ ] T125 Verify generated blog files are built fresh in CI on each deployment

### Manual Verification Checklist

- [ ] GitHub Actions workflow runs without errors
- [ ] `npm ci` step completes successfully
- [ ] `npm run build:blog` step completes successfully
- [ ] Blog pages present in deployment (check Actions artifacts or deployed site)
- [ ] Blog accessible on GitHub Pages at deployed URL
- [ ] Blog index loads correctly on deployed site
- [ ] Blog posts load correctly on deployed site
- [ ] Navigation between main site and blog works on deployed site
- [ ] Full workflow tested: local edit → commit → push → auto-deploy → verify live
- [ ] `public/blog/` directory not in git history (verify with `git status`)
- [ ] Deployment completes in under 5 minutes

**Checkpoint**: Automated deployment working - blog can go live

---

## Phase 9: Edge Cases & Error Handling (Polish)

**Purpose**: Handle edge cases gracefully

### Tasks

- [ ] T126 Test empty blog state (0 posts) - add placeholder message to `blog-index.njk` if no posts exist
- [ ] T127 Test very long post titles - add CSS text truncation or wrapping on index
- [ ] T128 Document image optimization guidance for authors in README.md (recommended sizes, formats)
- [ ] T129 Handle missing frontmatter - provide default values in 11ty config (default title, date, excerpt)
- [ ] T130 Test special characters in post titles/URLs (apostrophes, quotes, ampersands)
- [ ] T131 Add draft post mechanism - exclude posts with `draft: true` frontmatter from build
- [ ] T132 Test post modification dates - add `updated` frontmatter field if needed
- [ ] T133 Test cross-browser: Chrome (test blog on Chrome)
- [ ] T134 Test cross-browser: Firefox (test blog on Firefox)
- [ ] T135 Test cross-browser: Safari (test blog on Safari)
- [ ] T136 Test cross-browser: Edge (test blog on Edge)
- [ ] T137 Test very long blog posts (10,000+ words) - verify performance and layout
- [ ] T138 Test blog posts with many images (10+ images) - verify layout and loading
- [ ] T139 Test blog posts with no images - verify layout still looks good

### Manual Verification Checklist

- [ ] Blog index shows helpful message when no posts exist
- [ ] Long post titles don't break layout on index page
- [ ] Image optimization guidance documented in README.md
- [ ] Posts with missing frontmatter use sensible defaults
- [ ] Special characters in titles don't break URLs or display
- [ ] Draft posts excluded from build (not visible on site)
- [ ] Post modification dates work if implemented
- [ ] Blog works correctly in Chrome
- [ ] Blog works correctly in Firefox
- [ ] Blog works correctly in Safari
- [ ] Blog works correctly in Edge
- [ ] Very long posts load quickly and are readable
- [ ] Posts with many images load efficiently
- [ ] Posts with no images don't have awkward gaps

**Checkpoint**: All edge cases handled gracefully

---

## Phase 10: Documentation & Cleanup (Final)

**Purpose**: Project documented, code clean

### Tasks

- [ ] T140 [P] Update README.md with "Blog" section explaining blog feature
- [ ] T141 [P] Document how to write a blog post in README.md (include frontmatter template)
- [ ] T142 [P] Document build process in README.md (`npm run build:blog`)
- [ ] T143 [P] Document deployment process in README.md (auto-deploy on push to main)
- [ ] T144 [P] Document directory structure in README.md (posts/, _includes/, public/blog/)
- [ ] T145 Clean up unused CSS selectors in `public/assets/css/style.css`
- [ ] T146 Remove any console.log or debug code from templates
- [ ] T147 Run accessibility audit with axe DevTools on blog index page
- [ ] T148 Run accessibility audit with axe DevTools on blog post page
- [ ] T149 Fix any accessibility issues found in audit
- [ ] T150 Run Lighthouse performance audit on blog index page
- [ ] T151 Run Lighthouse performance audit on blog post page
- [ ] T152 Optimize performance based on Lighthouse recommendations
- [ ] T153 Complete requirements validation checklist (`specs/001-001-static-blog-system/checklists/requirements.md`)
- [ ] T154 Verify all 30 functional requirements pass
- [ ] T155 Verify all 4 non-functional requirements pass
- [ ] T156 Verify all 8 success criteria met
- [ ] T157 Update constitution.md with build process exception (allow Markdown compilation)
- [ ] T158 Final cross-browser test (Chrome, Firefox, Safari, Edge)
- [ ] T159 Final mobile device test (iOS Safari, Android Chrome)
- [ ] T160 Final keyboard navigation test (Tab, Enter, Esc)

### Manual Verification Checklist

- [ ] README.md has complete blog documentation
- [ ] Blog usage instructions are clear and actionable
- [ ] Frontmatter template is copy-paste ready
- [ ] Build and deployment processes documented
- [ ] Directory structure documented
- [ ] No unused CSS in stylesheet
- [ ] No console.log or debug code in production
- [ ] axe DevTools reports 0 critical accessibility issues on blog index
- [ ] axe DevTools reports 0 critical accessibility issues on blog posts
- [ ] Lighthouse performance score >90 on blog index
- [ ] Lighthouse performance score >90 on blog posts
- [ ] Lighthouse accessibility score 100 on blog index
- [ ] Lighthouse accessibility score 100 on blog posts
- [ ] All requirements checklist items pass
- [ ] Constitution updated with build exception
- [ ] Blog works in all browsers (Chrome, Firefox, Safari, Edge)
- [ ] Blog works on mobile devices (iOS, Android)
- [ ] Keyboard navigation works throughout blog

**Checkpoint**: Project complete and ready for production use

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Setup)**: No dependencies - can start immediately
- **Phase 1 (Templates)**: Depends on Phase 0 completion - BLOCKS all user stories
- **Phase 2 (US1)**: Depends on Phase 0 + Phase 1 completion
- **Phase 3 (US2)**: Depends on Phase 0 + Phase 1 completion - Can run in parallel with Phase 2
- **Phase 4 (US3)**: Depends on Phase 0 + Phase 1 completion - Can run in parallel with Phases 2-3
- **Phase 5 (US4)**: Depends on Phases 2-4 (content must exist to navigate to)
- **Phase 6 (US5)**: Depends on Phases 2-4 (test mobile responsiveness of existing content)
- **Phase 7 (SEO)**: Depends on Phase 1 (templates) - Can run in parallel with user stories
- **Phase 8 (Deployment)**: Depends on at least Phase 2 being testable (MVP content)
- **Phase 9 (Edge Cases)**: Depends on all user story phases being complete
- **Phase 10 (Documentation)**: Depends on all previous phases being complete

### User Story Dependencies

- **User Story 1 (P1 - Blog Reading)**: Can start after Phase 0 + Phase 1 - No dependencies on other stories
- **User Story 2 (P1 - Authoring)**: Can start after Phase 0 + Phase 1 - Independent of US1
- **User Story 3 (P2 - Discovery)**: Can start after Phase 0 + Phase 1 - Independent of US1/US2 but benefits from example posts
- **User Story 4 (P2 - Navigation)**: Depends on US1/US2/US3 having content to navigate to
- **User Story 5 (P3 - Mobile)**: Depends on US1/US2/US3 existing to test mobile responsiveness

### Within Each Phase

- Tasks marked [P] can run in parallel (different files, no conflicts)
- Manual verification checklist MUST be completed before marking phase done
- Foundation phases (0-1) must be 100% complete before user story work begins
- User story phases can be worked on in parallel by different team members
- Commit after completing each task or logical group of tasks

### Parallel Opportunities

**Phase 0 (Setup)**:
- T001 (install dependencies) and T010-T013 (create directories) can run in parallel
- T007-T009 (package.json scripts) can run in parallel

**Phase 1 (Templates)**:
- T015-T018 (base.njk setup) can run in parallel
- T025-T027 (CSS and Prism theme) can run in parallel

**Phase 2 (US1)**:
- T030-T032 (create example posts) can run in parallel
- T035-T037 (styling) can run in parallel with T039-T041 (accessibility/decorations)

**Phase 3 (US2)**:
- T045-T046 (documentation and test post) can run in parallel

**Phase 4 (US3)**:
- T061-T062 (template creation) can run in parallel with T065-T066 (CSS)

**Phase 7 (SEO)**:
- T104-T109 (meta tags) can all run in parallel

**Phase 10 (Documentation)**:
- T140-T144 (README updates) can run in parallel

**Cross-Phase Parallelism**:
- Once Phase 0 + Phase 1 complete, Phases 2, 3, 4, and 7 can all start in parallel
- Different team members can work on different user stories simultaneously

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Goal**: Ship basic blog reading functionality as fast as possible

1. Complete Phase 0: Setup & Configuration
2. Complete Phase 1: Base Templates & Styling
3. Complete Phase 2: User Story 1 (Blog Reading)
4. **STOP and VALIDATE**: Manually test User Story 1 per checklist
5. Complete Phase 8: Deployment (configure CI/CD)
6. Push to `main` → GitHub Actions auto-deploys to GitHub Pages
7. **Blog is LIVE with basic reading functionality!**

**MVP Deliverables**:
- ✅ Visitors can read 2-3 example blog posts
- ✅ Posts render correctly with Win95/dungeon aesthetic
- ✅ Mobile-responsive
- ✅ Auto-deploys via GitHub Actions

### Incremental Delivery

**After MVP is live, add features incrementally:**

1. **Increment 2**: Add Phase 3 (US2 - Authoring) → Push to `main` → Auto-deploys
   - Authors can now write posts easily in Markdown
2. **Increment 3**: Add Phase 4 (US3 - Discovery) → Push to `main` → Auto-deploys
   - Visitors can browse all posts on index page
3. **Increment 4**: Add Phase 5 (US4 - Navigation) → Push to `main` → Auto-deploys
   - Main site now links to blog
4. **Increment 5**: Add Phase 6 (US5 - Mobile) + Phase 7 (SEO) → Push to `main` → Auto-deploys
   - Mobile experience polished, SEO optimized
5. **Increment 6**: Add Phase 9 (Edge Cases) + Phase 10 (Documentation) → Push to `main` → Auto-deploys
   - All edge cases handled, project fully documented

**Each increment adds value without breaking previous functionality!**

### Parallel Team Strategy

**With multiple developers:**

1. **Together**: Complete Phase 0 + Phase 1 (foundation)
2. **Once foundation is done:**
   - Developer A: Phase 2 (US1 - Blog Reading)
   - Developer B: Phase 3 (US2 - Authoring)
   - Developer C: Phase 4 (US3 - Discovery)
   - Developer D: Phase 7 (SEO - meta tags)
3. **Merge and integrate**: Each developer completes their user story, tests independently, then merges
4. **Together**: Phase 5 (US4 - Navigation) - requires US1-US3 to be complete
5. **Together**: Phase 6 (US5 - Mobile) - test entire blog on mobile
6. **Together**: Phase 8 (Deployment) - configure CI/CD
7. **Together**: Phase 9 (Edge Cases) + Phase 10 (Documentation) - final polish

---

## Notes

- **[P] tasks**: Different files/sections, no dependencies, can run in parallel
- **[Story] label**: Maps task to specific user story (US1-US5) for traceability
- **Manual testing**: CRITICAL - complete checklist before marking phase done
- **Commit frequency**: Commit after each task or logical group (e.g., after T001-T003)
- **Commit messages**: Use conventional commits (e.g., "feat(blog): add 11ty configuration")
- **GitHub Actions**: Push to `main` triggers auto-deployment
- **Validation**: Stop at each checkpoint to validate phase independently
- **Constitution**: Update `.specify/memory/constitution.md` with build process exception in Phase 10

### Avoid

- Vague tasks without specific file paths
- Working on same file section simultaneously (causes merge conflicts)
- Cross-story dependencies that break independence (each story should be self-contained)
- Skipping manual verification checklists (critical for quality)
- Committing `public/blog/` generated files (should be built in CI only)

---

**Total Tasks**: 160  
**Estimated Phases**: 10  
**Priority User Stories**: US1 (P1), US2 (P1), US3 (P2), US4 (P2), US5 (P3)  
**MVP Milestone**: Complete Phases 0, 1, 2, 8 (Setup + Templates + Reading + Deployment)  
**Full Feature Completion**: All 10 phases complete with checklists validated

**Ready to begin implementation!** 🚀
