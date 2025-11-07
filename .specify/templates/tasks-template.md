---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Testing**: This project uses MANUAL TESTING ONLY per Constitution Principle I (Simplicity First). No automated test infrastructure exists. Each task should include manual verification steps.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

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
- **NO** backend/, frontend/, src/, tests/, or dist/ directories
- Paths shown below assume static site structure per Constitution

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify `public/` directory structure matches plan.md
- [ ] T002 [P] Run `yarn install` to ensure dev dependencies available
- [ ] T003 [P] Test local server with `yarn start` at http://localhost:3000

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks for static website (adjust based on your feature):

- [ ] T004 Add CSS variables for feature colors/dimensions in `public/assets/css/style.css`
- [ ] T005 [P] Create placeholder HTML structure in `public/index.html`
- [ ] T006 [P] Add required image assets to `public/assets/img/`
- [ ] T007 Define base animations/keyframes in CSS (if feature requires animations)
- [ ] T008 Setup event listeners for interactive elements (if feature has interactivity)
- [ ] T009 Verify accessibility baseline (semantic HTML, ARIA labels if needed)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Manual Verification**: [How to manually test this story independently]
- [ ] Verify [specific behavior] by [action in browser]
- [ ] Test keyboard navigation with Tab/Enter/Esc
- [ ] Check screen reader announces [element] correctly
- [ ] Validate responsive layout at mobile/tablet/desktop breakpoints
- [ ] Confirm no console errors in browser DevTools

### Implementation for User Story 1

- [ ] T010 [P] [US1] Add HTML markup for [feature] in `public/index.html`
- [ ] T011 [P] [US1] Create CSS styles for [feature] in `public/assets/css/style.css`
- [ ] T012 [US1] Implement JavaScript for [interactive behavior] in `public/index.html` <script> tag
- [ ] T013 [US1] Add required image assets to `public/assets/img/`
- [ ] T014 [US1] Add ARIA labels and semantic HTML for accessibility
- [ ] T015 [US1] Add CSS animations respecting prefers-reduced-motion
- [ ] T016 [US1] Test retro aesthetic consistency (matches Win95/dungeon theme)

**Manual Testing Checklist** (complete before marking story done):
- [ ] All links/buttons work correctly
- [ ] Modal opens/closes via click and Esc key (if applicable)
- [ ] Animations play smoothly at 60fps
- [ ] Layout responsive on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] No console errors or warnings
- [ ] Images load correctly (check Network tab)
- [ ] Color contrast meets WCAG AA (use browser DevTools)

**Checkpoint**: At this point, User Story 1 should be fully functional and manually verified

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Manual Verification**: [How to manually test this story independently]
- [ ] Verify [specific behavior] by [action in browser]
- [ ] Test keyboard navigation with Tab/Enter/Esc
- [ ] Check screen reader announces [element] correctly
- [ ] Validate responsive layout at mobile/tablet/desktop breakpoints

### Implementation for User Story 2

- [ ] T017 [P] [US2] Add HTML markup for [feature] in `public/index.html`
- [ ] T018 [P] [US2] Create CSS styles for [feature] in `public/assets/css/style.css`
- [ ] T019 [US2] Implement JavaScript for [interactive behavior]
- [ ] T020 [US2] Add required assets to `public/assets/img/`
- [ ] T021 [US2] Integrate with User Story 1 components (if needed)

**Manual Testing Checklist**:
- [ ] Feature works independently
- [ ] Integration with US1 doesn't break existing functionality
- [ ] Keyboard navigation, responsive design, accessibility verified

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Manual Verification**: [How to manually test this story independently]

### Implementation for User Story 3

- [ ] T022 [P] [US3] Add HTML markup for [feature] in `public/index.html`
- [ ] T023 [P] [US3] Create CSS styles for [feature] in `public/assets/css/style.css`
- [ ] T024 [US3] Implement JavaScript for [interactive behavior]
- [ ] T025 [US3] Add required assets to `public/assets/img/`

**Manual Testing Checklist**: [Same verification steps as US1/US2]

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Update README.md documentation (if feature user-facing)
- [ ] TXXX [P] Code cleanup: remove unused CSS, optimize selectors
- [ ] TXXX Performance optimization: minify inline JS if >100 lines
- [ ] TXXX Accessibility audit: run axe DevTools on all pages
- [ ] TXXX Cross-browser testing: Chrome, Firefox, Safari, Edge
- [ ] TXXX Mobile testing: iOS Safari, Android Chrome
- [ ] TXXX Verify retro aesthetic consistency across all new elements
- [ ] TXXX Final manual testing checklist (see Constitution manual testing requirements)
- [ ] TXXX Validate GitHub Actions deployment still works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Manual verification checklist MUST be completed before marking story done
- HTML markup before CSS styling
- CSS styling before JavaScript interactivity
- Core implementation before accessibility enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- HTML and CSS for a user story marked [P] can run in parallel (different sections of files)
- Image asset creation marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch HTML and CSS tasks for User Story 1 together:
Task: "Add HTML markup for [feature] in public/index.html"
Task: "Create CSS styles for [feature] in public/assets/css/style.css"

# Launch asset creation tasks in parallel:
Task: "Create sprite animation frames in public/assets/img/"
Task: "Create UI element graphics in public/assets/img/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Manually test User Story 1 per checklist
5. Push to `main` → GitHub Actions auto-deploys to GitHub Pages

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Manually test → Push to `main` (auto-deploys - MVP!)
3. Add User Story 2 → Manually test → Push to `main` (auto-deploys)
4. Add User Story 3 → Manually test → Push to `main` (auto-deploys)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files/sections, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and manually testable
- Complete manual verification checklist before marking story done
- Commit after each task or logical group (use conventional commits)
- Push to `main` triggers GitHub Actions deployment
- Stop at any checkpoint to validate story independently via browser testing
- Avoid: vague tasks, same file section conflicts, cross-story dependencies that break independence
