#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');

// Configuration
const ARTICLES_DIR = path.join(__dirname, 'data', 'articles');
const OUTPUT_DIR = path.join(__dirname, 'public');
const WRITING_DIR = path.join(OUTPUT_DIR, 'writing');

// Create necessary directories
function ensureDirectories() {
  if (!fs.existsSync(WRITING_DIR)) {
    fs.mkdirSync(WRITING_DIR, { recursive: true });
  }
}

// Parse the Markdown files with frontmatter
function getArticles() {
  const articles = [];
  
  try {
    const files = fs.readdirSync(ARTICLES_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const filePath = path.join(ARTICLES_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);
      
      if (data.draft === true) continue;
      
      const slug = data.slug || path.basename(file, '.md');
      
      articles.push({
        title: data.title || 'Untitled',
        description: data.description || '',
        date: data.date || new Date(),
        slug,
        content: content,
        html: marked.parse(content)
      });
    }
  } catch (error) {
    console.error('Error reading articles:', error);
  }
  
  // Sort by date (newest first)
  return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Generate the articles list page
function generateArticlesList(articles) {
  // Read the template
  const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Writing - Roshan Bhatia</title>
  <link rel="stylesheet" href="https://fx.hot.page/style">
  <link rel="stylesheet" href="../assets/css/style.css">
  <script src="https://unpkg.com/htmx.org@1.9.10" defer></script>
  <script src="https://unpkg.com/alpinejs@3.13.3" defer></script>
</head>
<body>
  <div class="fx-content page-transition">
    <h2>Writing</h2>
    <p>My thoughts, tutorials, and notes on software development and technology.</p>
    
    <div id="articles-container" class="fx-grid">
      ${articles.length > 0 
        ? articles.map(article => {
            const date = new Date(article.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return `<a href="${article.slug}.html" hx-get="${article.slug}.html" hx-target="#content" hx-push-url="true" class="fx-article-card">
        <h3>${article.title}</h3>
        <div class="fx-article-date">${date}</div>
        <p>${article.description}</p>
      </a>`;
          }).join('\n      ')
        : `<div class="fx-empty">
        <p>No articles yet. Check back soon!</p>
      </div>`
      }
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(WRITING_DIR, 'index.html'), template);
  console.log('Generated articles list page');
}

// Generate individual article pages
function generateArticlePages(articles) {
  for (const article of articles) {
    const date = new Date(article.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} - Roshan Bhatia</title>
  <link rel="stylesheet" href="https://fx.hot.page/style">
  <link rel="stylesheet" href="../assets/css/style.css">
  <script src="https://unpkg.com/htmx.org@1.9.10" defer></script>
  <style>
    .fx-article {
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    
    .fx-article h1 {
      margin-top: 0;
      color: var(--fx-primary);
    }
    
    .fx-article h2 {
      color: var(--fx-secondary);
      margin-top: 2rem;
    }
    
    .fx-article-meta {
      color: var(--fx-text-secondary);
      margin-bottom: 2rem;
    }
    
    .fx-article pre {
      background: var(--fx-card-background);
      padding: 1rem;
      border-radius: var(--fx-radius);
      overflow-x: auto;
    }
    
    .fx-article-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--fx-border);
    }
    
    .fx-back-to-articles {
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <div class="fx-content page-transition">
    <div class="fx-back-to-articles">
      <a href="index.html" hx-get="index.html" hx-target="#content" hx-push-url="true">
        ← Back to Articles
      </a>
    </div>
    
    <article class="fx-article">
      <h1>${article.title}</h1>
      <div class="fx-article-meta">
        <span>${date}</span>
      </div>
      
      <div class="fx-article-content">
        ${article.html}
      </div>
      
      <div class="fx-article-nav">
        <div></div>
        <div></div>
      </div>
    </article>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(WRITING_DIR, `${article.slug}.html`), template);
    console.log(`Generated article page: ${article.slug}.html`);
  }
}

// Main build function
function build() {
  console.log('Building static site...');
  
  ensureDirectories();
  
  const articles = getArticles();
  generateArticlesList(articles);
  generateArticlePages(articles);
  
  console.log('Static site built successfully!');
}

// Run the build
build();