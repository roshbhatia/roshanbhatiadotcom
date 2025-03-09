# roshanbhatiadotcom 🧙‍♂️🔮

This is the source code for my personal website - a retro 90s GeoCities-inspired dungeon fantasy theme built with htmx and fx.hot.page.

## 🔥 Features

- Retro 90s GeoCities-inspired dungeon fantasy theme
- Windows 95-style menubar
- Projects section that automatically fetches and displays repos with the "internal" topic from GitHub
- Writing section for blog posts and articles styled as ancient scrolls
- Built with htmx for dynamic content loading
- Styled with fx.hot.page and custom CSS
- Interactive dungeon decorations (torches, cobwebs, chains, floating dust particles)

## 🚀 Development

### Prerequisites

- [Node.js](https://nodejs.org/) (latest LTS version)
- [Yarn](https://yarnpkg.com/) package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/roshbhatia/roshanbhatiadotcom.git
cd roshanbhatiadotcom

# Install dependencies
yarn install
```

### Running Locally

```bash
# Start the development server
yarn dev
```

This will start a static file server and make your site available at http://localhost:3000.

### How It Works

This is a fully static site with dynamic content loading:
- The main structure is in `/public/index.html`
- Styling is in `/public/assets/css/style.css`
- Projects are fetched client-side via the GitHub API
- Articles are stored as Markdown files in `/data/articles/`

### Adding Content

#### Articles

To add a new article, create a Markdown file in the `data/articles` directory with frontmatter:

```markdown
---
title: "My Article Title"
description: "Brief description of the article"
date: 2025-03-08T12:00:00-07:00
draft: false
---

Your article content in Markdown format.
```

Then add a corresponding HTML file to the `/public/writing/` directory.

#### Projects

Projects are automatically fetched from your GitHub account via the GitHub API. To include a project:

1. Add the "internal" topic to the repository on GitHub:
   - Go to your repo on GitHub
   - Click on "Manage topics" (near the About section)
   - Add "internal" as a topic
   - Save changes

The site will automatically display these projects on the Projects page.

## 📦 Deployment

This site is designed to be deployed on GitHub Pages:

1. Push the `/public` directory to GitHub Pages
2. That's it! No build process needed.

Alternatively, you can deploy to any static site hosting service.

## 📝 License

MIT License
