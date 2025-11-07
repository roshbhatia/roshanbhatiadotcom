---
title: "Welcome to the Dungeon"
date: 2024-01-15
tags: 
  - post
  - meta
  - retro
description: "A journey into the retro web aesthetic - building a personal site with 90s dungeon crawler vibes"
layout: layouts/blog-post.njk
---

## Greetings, Adventurer

Welcome to my corner of the web - a digital dungeon where the torches flicker with JavaScript and the walls are built with CSS.

This site is a love letter to the early web and classic dungeon crawlers like Daggerfall. No frameworks, no build steps (well, except for this blog), just pure HTML, CSS, and vanilla JavaScript doing their thing.

## The Philosophy

In an age of complex frameworks and gigabyte node_modules folders, sometimes it's refreshing to go back to basics:

- **No frameworks** - Just the web platform itself
- **Retro aesthetic** - 90s web meets dungeon crawler pixel art
- **Simple deployment** - Static files on GitHub Pages
- **Fast loading** - No massive bundles to download

## Building in the Dark

Here's a taste of the vanilla JavaScript that powers the torch animations:

```javascript
// Animate the dungeon torches
const torches = document.querySelectorAll('.torch');
torches.forEach(torch => {
  setInterval(() => {
    torch.style.opacity = 0.7 + Math.random() * 0.3;
  }, 100 + Math.random() * 100);
});
```

Simple, effective, and no dependencies required.

## The CSS Sorcery

The Win95-style borders are created with pure CSS ridge borders:

```css
.modal-content {
  border: 4px ridge var(--win95-button-face);
  box-shadow: inset -2px -2px 0 var(--win95-button-shadow),
              inset 2px 2px 0 var(--win95-button-highlight);
}
```

This creates that iconic beveled look without any images.

## What's Next

More posts coming soon about:
- Building retro web animations
- CSS tricks for pixel-perfect designs
- JavaScript game dev experiments
- Web accessibility in retro designs

Thanks for stopping by the dungeon. Don't forget to check your inventory before you leave.

---

*May your code compile and your servers stay up.*
