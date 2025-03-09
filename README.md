# Roshan Bhatia's Personal Website

This is the source code for my personal website, built with htmx and fx.hot.page for a lightweight, modern web experience.

## Features

- Simple static site - can be hosted on GitHub Pages or any static hosting
- Projects section that automatically fetches and displays repos with the "internal" topic from GitHub
- Writing section for blog posts and articles
- Built with htmx for dynamic content loading without a heavy JavaScript framework
- Styled with fx.hot.page for a clean, minimal design

## Development

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/roshbhatia/roshanbhatiadotcom.git
cd roshanbhatiadotcom
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

This will:
- Build the site
- Start a local development server at http://localhost:8080
- Watch for changes to rebuild automatically

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

The `draft: true` property can be used to prevent an article from being published.

#### Projects

Projects are automatically fetched from your GitHub account. To include a project:

1. Add the "internal" topic to the repository on GitHub:
   - Go to your repo on GitHub
   - Click on "Manage topics" (near the About section)
   - Add "internal" as a topic
   - Save changes

The site will automatically display these projects on the Projects page.

### Building for Production

To build the site for production:

```bash
npm run build
```

This generates the static site in the `public` directory, which you can deploy to any static hosting service.

## Deployment

This site is designed to be deployed on GitHub Pages:

1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy the site

You can also deploy to other static hosting providers by uploading the contents of the `public` directory.

## License

MIT License
