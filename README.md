# roshanbhatiadotcom

Source for [roshanbhatia.com](https://roshanbhatia.com). Vite + React +
TypeScript, built to static files and served by GitHub Pages.

## Publishing a post

1. Make a folder: `writing/002/` (three digits, highest number sorts newest).
2. Write `writing/002/post.md`:

   ```markdown
   ---
   title: "The title"
   date: "2026-08-04"
   ---

   Body text. Standard markdown: headings, lists, tables, blockquotes,
   fenced code, links. Bare URLs become links on their own.
   ```

3. Put images in `writing/002/assets/` and reference them relatively:

   ```markdown
   ![This becomes the caption](assets/photo.png)
   ```

4. Commit and push to `main`. That is the whole deploy.

Add `draft: "true"` to the frontmatter to keep a post out of the build.

### What the build does for you

`scripts/generate-writings.mjs` runs before Vite, so the browser downloads no
markdown parser and no syntax highlighter:

- renders markdown to HTML, and highlights code with Shiki in the light and
  dark palettes at once
- resizes images to 1600px wide and converts them to WebP (one post went from
  18MB of PNGs to 1.5MB)
- builds the table of contents from `##` and `###`, with de-duplicated anchors
- derives the excerpt and the reading time, ignoring code blocks

Alt text doubles as the figure caption. When a caption is present the `alt`
attribute is emptied, so a screen reader announces it once instead of twice.
An image written as `![](assets/x.png)` gets no caption and no alt text.

## Development

Requires Node 20+ and npm. Do not add a `yarn.lock`; the build installs from
`package-lock.json`.

```bash
npm install
npm run dev        # regenerates content, then serves on :5173
npm run build      # typechecks, then builds to dist/
npm run typecheck
npm run test:unit  # content pipeline
npm run test:e2e   # cypress against a dev server
```

`src/writings.generated.ts`, `src/version.ts`, and `public/writing/` are build
output and are not tracked. The sources of truth are `writing/` and git.

## Theme

One theme, two modes. Dark is a phosphor terminal, light is its Win95
counterpart, and the toggle is in the footer. A first visit follows the
operating system; after that the choice is remembered. Colours are CSS custom
properties in `src/styles/globals.css` under `:root` and `[data-theme='light']`
— add a variable to both places or to neither.

Tailwind colour keys are kebab-case on purpose. Tailwind uses config keys
verbatim, so a `codeBg` key answers only to `bg-codeBg`, and the `bg-code-bg`
in the markup would silently resolve to nothing.

## A note on `public/sw.js`

It is a tombstone. A Workbox service worker once precached `index.html` and
served it for every navigation, which pinned returning visitors to a 2024
snapshot of the site. The file at that URL now unregisters itself and clears
its caches. Leave it deployed until old clients have checked in.
